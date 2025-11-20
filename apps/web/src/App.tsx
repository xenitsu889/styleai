import React from "react";
import { useState, useEffect, useRef } from "react";
import { WelcomePage } from "./components/WelcomePage";
import { PersonalInfoSetup } from "./components/PersonalInfoSetup";
import { Dashboard } from "./components/Dashboard";
import { Wardrobe } from "./components/Wardrobe";
import { WardrobeAssist } from "./components/WardrobeAssist";
import { AIChatbot, ChatSession, Message } from "./components/AIChatbot";
import { ShopperAI } from "./components/ShopperAI";
import { MakeupAI } from "./components/MakeupAI";
import { FashionTips } from "./components/FashionTips";
import { Profile } from "./components/Profile";
import { BottomNav } from "./components/BottomNav";
import {
  ensureUserId,
  getProfile,
  saveProfile,
  getWardrobe,
  addWardrobeItem,
  deleteWardrobeItem,
  uploadWardrobeImage,
  fetchChatHistory,
  deleteChat,
  createChat,
} from "./services/api";
import { Auth } from "./components/Auth";
import { onAuthUserChanged, signOutUser, getSavedUid } from "./services/auth";
import { linkAccount } from "./services/api";

export type UserProfile = {
  name: string;
  age: string;
  height: string;
  gender: string;
  bodyType: string;
  skinTone: string;
  photo?: string;
  region?: string;
  favouriteColours?: string[];
  email?: string;
  languagePref?: string;
};

export type WardrobeItem = {
  id: string;
  category: string;
  image: string;
  name: string;
};

// Convert Firestore timestamps (any shape) into Date instances so the UI reflects
// authoritative server times and not the local clock.
const parseTimestamp = (value: any): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (typeof value === "number") return new Date(value);
  const candidate = value as any;
  if (candidate?.toDate) {
    try {
      const d = candidate.toDate();
      if (d instanceof Date && !Number.isNaN(d.getTime())) return d;
    } catch {}
  }
  if (typeof candidate?.seconds === "number") {
    const ms =
      candidate.seconds * 1000 +
      Math.floor((candidate.nanoseconds || 0) / 1_000_000);
    return new Date(ms);
  }
  if (typeof candidate?._seconds === "number") {
    const ms =
      candidate._seconds * 1000 +
      Math.floor((candidate._nanoseconds || 0) / 1_000_000);
    return new Date(ms);
  }
  return new Date();
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("welcome");
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  // True after the first onAuthUserChanged callback fires. We use this to
  // avoid redirecting to SignIn during the initial hydration window while
  // Firebase restores the persisted session.
  const [authHydrated, setAuthHydrated] = useState<boolean>(false);
  const [authInitialMode, setAuthInitialMode] = useState<"signin" | "signup">(
    "signin"
  );
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [isLoadingWardrobe, setIsLoadingWardrobe] = useState<boolean>(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  // Temporary overlay when user clicks Get Started and they're already
  // authenticated — we skip the Auth page and show a loading screen until
  // dashboard data is ready.
  const [showLaunchLoading, setShowLaunchLoading] = useState(false);
  const initialAuthHandledRef = useRef(false);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatSessionId, setCurrentChatSessionId] = useState<
    string | null
  >(null);
  const [isLoadingChats, setIsLoadingChats] = useState<boolean>(false);

  // A simple ref to remember whether the user just performed a signup or signin
  // so we can decide whether to show ProfileSetup (only after signup).
  const lastAuthActionRef = useRef<"signin" | "signup" | null>(null);
  // When user clicks Get Started, set this so the auth flow knows the user
  // explicitly requested the Auth UI (prevents auto-redirect on initial hydration).
  const forceShowAuthRef = useRef<boolean>(false);
  // Track previous auth state so we only auto-redirect after a *new* login.
  // If the user was already authenticated and manually navigates to the auth
  // page (e.g. via "Get Started Free" wanting to view sign-in), we avoid
  // bouncing them immediately to the dashboard.
  const prevAuthedRef = useRef<boolean>(false);

  useEffect(() => {
    const unsub = onAuthUserChanged(async (u) => {
      // Mark that we've received the initial callback at least once
      const wasInitial = !initialAuthHandledRef.current;
      if (wasInitial) initialAuthHandledRef.current = true;

      const isNowAuthed = !!u;
      const wasAuthedBefore = prevAuthedRef.current;
      prevAuthedRef.current = isNowAuthed;
      setIsAuthed(isNowAuthed);
      if (!authHydrated) setAuthHydrated(true);

      if (u) {
        // If we have a legacy local user id (created prior to authentication)
        // attempt to link it into the authenticated Firebase UID so the
        // user's old profile/wardrobe data becomes available under their
        // authenticated account.
        // No longer link legacy ids automatically; new accounts always use Firebase UID.
        // Fetch profile but only redirect depending on context.
        setIsLoadingProfile(true);
        try {
          const userId = ensureUserId();
          const profileData = await getProfile(userId);

          if (profileData && !profileData.error && profileData.name) {
            setUserProfile({
              name: profileData.name,
              age: profileData.age ? String(profileData.age) : "",
              height: profileData.heightRange || "",
              gender: profileData.gender || "",
              bodyType: profileData.bodyType || "",
              skinTone: profileData.skinTone || "",
              photo: profileData.imageUrl,
              email: (profileData as any).email || undefined,
              languagePref: (profileData as any).languagePref || undefined,
              favouriteColours: (profileData as any).favouriteColours || [],
              region: (profileData as any).region || "",
            });

            // Redirect rules:
            // - If this is the initial hydration and user didn't click Get Started,
            //   do not redirect (stay on welcome)
            // - If the user explicitly requested Auth (forceShowAuthRef) or the
            //   current page is auth, navigate to dashboard after successful auth
            // Only redirect away from auth after a *new* login event.
            // If user was already authenticated and manually visited /SignIn,
            // allow them to remain on the auth page.
            if (!wasAuthedBefore) {
              if (!wasInitial || forceShowAuthRef.current) {
                if (currentPage === "auth" || forceShowAuthRef.current) {
                  setCurrentPage("dashboard");
                }
              }
            }
          } else {
            // No profile found. Only show setup when the last action was signup
            // or the user explicitly requested the auth flow.
            if (
              lastAuthActionRef.current === "signup" ||
              forceShowAuthRef.current
            ) {
              setCurrentPage("setup");
            } else {
              // Default to dashboard
              if (!wasAuthedBefore) {
                if (!wasInitial || forceShowAuthRef.current)
                  setCurrentPage("dashboard");
              }
            }
          }
        } catch (err) {
          console.error("Error loading profile:", err);
          if (!wasAuthedBefore) {
            if (!wasInitial || forceShowAuthRef.current)
              setCurrentPage("dashboard");
          }
        } finally {
          setIsLoadingProfile(false);
          forceShowAuthRef.current = false;
          lastAuthActionRef.current = null;
        }
      } else {
        // Not authenticated
        setUserProfile(null);
        setWardrobeItems([]);
        setChatSessions([]);
        setCurrentChatSessionId(null);
        if (!wasInitial) setCurrentPage("welcome");
      }
    });
    return () => unsub();
  }, []);

  const pathToPage = (path: string) => {
    const p = path.split("?")[0];
    switch (p.toLowerCase()) {
      case "/":
      case "":
        return "welcome";
      case "/dashboard":
        return "dashboard";
      case "/aichat":
      case "/aichat/":
        return "chat";
      case "/wardrobe/assist":
        return "assist";
      case "/wardrobe":
        return "wardrobe";
      case "/tips":
        return "tips";
      case "/profile":
        return "profile";
      case "/profilesetup":
        return "setup";
      case "/shopper":
        return "shopper";
      case "/makeup":
        return "makeup";
      case "/profile/edit":
        return "edit-profile";

      case "/signin":
        return "auth";
      case "/signup":
        return "signup";
      default:
        return "welcome";
    }
  };

  const pageToPath = (page: string) => {
    switch (page) {
      case "dashboard":
        return "/Dashboard";
      case "chat":
        return "/AiChat";
      case "assist":
        return "/Wardrobe/Assist";
      case "wardrobe":
        return "/Wardrobe";
      case "tips":
        return "/Tips";
      case "profile":
        return "/Profile";
      case "shopper":
        return "/Shopper";
      case "makeup":
        return "/Makeup";
      case "setup":
        return "/ProfileSetup";
      case "edit-profile":
        return "/Profile/Edit";
      case "auth":
        return "/SignIn";
      case "signup":
        return "/SignUp";
      case "welcome":
        return "/";
      default:
        return "/";
    }
  };

  // On mount, sync initial page from URL
  useEffect(() => {
    const initial = pathToPage(window.location.pathname || "/");
    setCurrentPage(initial);
    // If the initial path explicitly requested signup, start Auth in signup
    if (initial === "signup") {
      setAuthInitialMode("signup");
    }

    const onPop = () => {
      const p = pathToPage(window.location.pathname || "/");
      setCurrentPage(p);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Whenever currentPage changes, push a new history entry (keeps URL and UI in sync)
  useEffect(() => {
    try {
      const target = pageToPath(currentPage || "");
      if (window.location.pathname !== target) {
        window.history.pushState({}, "", target);
      }
    } catch (e) {
      // ignore
    }
  }, [currentPage]);

  const handleSignup = () => {
    // If already authenticated, go straight to dashboard and show a
    // lightweight loading screen until initial data has loaded.
    if (isAuthed) {
      setShowLaunchLoading(true);
      setCurrentPage("dashboard");
      return;
    }
    // Otherwise, navigate to auth page in sign-in mode
    setAuthInitialMode("signin");
    forceShowAuthRef.current = true; // treat as intentional auth navigation
    setCurrentPage("auth");
  };

  // Hide the launch loading overlay once we're on dashboard and initial
  // data loads have finished.
  useEffect(() => {
    if (
      showLaunchLoading &&
      currentPage === "dashboard" &&
      isAuthed &&
      !isLoadingWardrobe &&
      !isLoadingProfile
    ) {
      setShowLaunchLoading(false);
    }
  }, [
    showLaunchLoading,
    currentPage,
    isAuthed,
    isLoadingWardrobe,
    isLoadingProfile,
  ]);

  const handleProfileComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentPage("dashboard");
  };

  const handleEditProfile = () => {
    setCurrentPage("edit-profile");
  };

  const handleUpdateProfile = async (profile: UserProfile) => {
    const userId = ensureUserId();
    try {
      await saveProfile({
        userId,
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        heightRange: profile.height,
        bodyType: profile.bodyType,
        skinTone: profile.skinTone,
        imageUrl: profile.photo,
        email: profile.email,
        region: profile.region,
        favouriteColours: profile.favouriteColours,
      });
    } catch {}
    setUserProfile(profile);
    setCurrentPage("profile");
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      try {
        await signOutUser();
      } catch (error) {
        console.error("Error signing out:", error);
      }
      // The onAuthUserChanged handler will handle clearing state and redirecting to welcome
    }
  };

  // Chat session handlers
  const createNewChatSession = () => {
    // createNewChatSession can be called from multiple places. Expose a
    // stable loading indicator while we create a backend chat doc and
    // initialize the UI session. We wrap the async work and ensure the
    // loading flag is set while in progress.
    (async () => {
      setIsLoadingChats(true);
      try {
        const userId = ensureUserId();
        const created = await createChat(userId);
        const newSession: ChatSession = {
          id: created.chatId,
          title: "New Chat",
          messages: [
            {
              id: "1",
              text: "Hey! I’m StylieAI – your friendly style buddy. Feel free to share how your day’s going, your mood, or anything you’d like to wear and we’ll take it from there.",
              sender: "ai",
              timestamp: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Keep only the 2 most recent sessions (so with the new one, we have 3 total)
        const updatedSessions = [newSession, ...chatSessions].slice(0, 3);
        setChatSessions(updatedSessions);
        setCurrentChatSessionId(newSession.id);
      } catch (err) {
        // fallback to local-only session creation
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: "New Chat",
          messages: [
            {
              id: "1",
              text: "Hey! I’m StylieAI – your friendly style buddy. Feel free to share how your day’s going, your mood, or anything you’d like to wear and we’ll take it from there.",
              sender: "ai",
              timestamp: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const updatedSessions = [newSession, ...chatSessions].slice(0, 3);
        setChatSessions(updatedSessions);
        setCurrentChatSessionId(newSession.id);
      } finally {
        setIsLoadingChats(false);
      }
    })();
  };

  const switchChatSession = (sessionId: string) => {
    setCurrentChatSessionId(sessionId);
  };

  const deleteChatSession = (sessionId: string) => {
    // Prefer deleting on the backend first so the chat does not reappear after refresh.
    (async () => {
      const userId = ensureUserId();
      try {
        const res = await deleteChat(userId, sessionId);
        if (!res || (res as any).success === false) {
          throw new Error("Server failed to delete chat");
        }

        // Removal succeeded on backend — remove locally
        const updatedSessions = chatSessions.filter((s) => s.id !== sessionId);
        setChatSessions(updatedSessions);

        // If we deleted the current session, switch to the first available or clear
        if (sessionId === currentChatSessionId) {
          if (updatedSessions.length > 0) {
            setCurrentChatSessionId(updatedSessions[0].id);
          } else {
            setCurrentChatSessionId(null);
          }
        }
      } catch (err) {
        console.error("Failed to delete chat on server:", err);
        alert("Could not delete chat on the server. Please try again.");
      }
    })();
  };

  const updateChatSession = (sessionId: string, messages: Message[]) => {
    setChatSessions((prevSessions) => {
      const updated = prevSessions.map((session) => {
        if (session.id === sessionId) {
          // Generate title from first user message if still "New Chat"
          let title = session.title;
          if (title === "New Chat" && messages.length > 1) {
            const firstUserMsg = messages.find((m) => m.sender === "user");
            if (firstUserMsg) {
              title =
                firstUserMsg.text.length > 40
                  ? firstUserMsg.text.substring(0, 40) + "..."
                  : firstUserMsg.text;
            }
          }

          return {
            ...session,
            title,
            messages,
            updatedAt: new Date(),
          };
        }
        return session;
      });

      // Sort by most recent update and keep only the 3 most recent
      return updated
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 3);
    });
  };

  // Initialize chat session when user navigates to chat page

  // If the user is not authenticated and navigates to a protected page,
  // redirect to auth. Importantly, we WAIT until authHydrated is true so
  // we don't bounce to SignIn during a refresh while Firebase is restoring
  // the session.
  useEffect(() => {
    if (!authHydrated) return;
    if (
      !isAuthed &&
      currentPage !== "welcome" &&
      currentPage !== "auth" &&
      currentPage !== "setup" &&
      currentPage !== "edit-profile"
    ) {
      setCurrentPage("auth");
    }
  }, [authHydrated, isAuthed, currentPage]);

  const handleAddWardrobeItem = async (item: WardrobeItem) => {
    const userId = ensureUserId();
    let imageUrl: string | undefined = undefined;
    if (item.image && item.image.startsWith("data:")) {
      try {
        const up = await uploadWardrobeImage(userId, item.image);
        imageUrl = up.url;
      } catch {}
    }
    try {
      await addWardrobeItem(userId, {
        name: item.name,
        category: item.category,
        imageUrl,
      });
    } catch {}
    setWardrobeItems([
      ...wardrobeItems,
      { ...item, image: imageUrl || item.image },
    ]);
  };

  const handleDeleteWardrobeItem = async (id: string) => {
    const userId = ensureUserId();
    try {
      await deleteWardrobeItem(userId, id);
    } catch {}
    setWardrobeItems(wardrobeItems.filter((item) => item.id !== id));
  };

  // Initial fetch of profile and wardrobe (only when authenticated)
  useEffect(() => {
    if (!isAuthed) return;
    const userId = ensureUserId();
    console.log("Initial fetch: userId =", userId);
    (async () => {
      try {
        const p = await getProfile(userId);
        console.log("Initial fetch: Profile response =", p);
        if (p && typeof p === "object" && !("error" in p)) {
          const mapped: UserProfile = {
            name: p.name || "",
            age: (p.age || "").toString(),
            height: p.heightRange || "",
            gender: p.gender || "",
            bodyType: p.bodyType || "",
            skinTone: p.skinTone || "",
            photo: p.imageUrl,
            email: (p as any).email || undefined,
            languagePref: (p as any).languagePref || undefined,
            favouriteColours: (p as any).favouriteColours || [],
            region: (p as any).region || "",
          };
          setUserProfile(mapped);
        }
      } catch {}
      // Fetch wardrobe and show loading while it resolves to avoid empty-state flash
      setIsLoadingWardrobe(true);
      try {
        const w = await getWardrobe(userId);
        console.log("Initial fetch: Wardrobe response =", w);
        const items = (w.items || []).map((it) => ({
          id: it.id,
          category: it.category,
          image: it.imageUrl || "",
          name: it.name,
        })) as WardrobeItem[];
        console.log("Initial fetch: Mapped items =", items);
        setWardrobeItems(items);
      } catch (err) {
        console.error("Error fetching wardrobe:", err);
      }
      setIsLoadingWardrobe(false);
    })();
  }, [isAuthed]);

  // Fetch data when navigating to dashboard to ensure fresh data is loaded
  // even when the user was already authenticated (e.g., persisted session).
  useEffect(() => {
    if (!isAuthed) return;
    if (currentPage !== "dashboard") return;

    const userId = ensureUserId();
    console.log("Dashboard: Fetching wardrobe for userId:", userId);
    (async () => {
      // Re-fetch wardrobe items when entering dashboard
      setIsLoadingWardrobe(true);
      try {
        const w = await getWardrobe(userId);
        console.log("Dashboard: Wardrobe response:", w);
        const items = (w.items || []).map((it) => ({
          id: it.id,
          category: it.category,
          image: it.imageUrl || "",
          name: it.name,
        })) as WardrobeItem[];
        console.log("Dashboard: Mapped wardrobe items:", items);
        setWardrobeItems(items);
      } catch (err) {
        console.error("Error fetching wardrobe on dashboard:", err);
      }
      setIsLoadingWardrobe(false);
    })();
  }, [currentPage, isAuthed]);

  // Ensure the wardrobe loading indicator appears immediately when the
  // user is on the Wardrobe page and we haven't fetched items yet.
  // This prevents the UI from briefly showing the empty-state before the
  // fetch effect sets `isLoadingWardrobe`.
  useEffect(() => {
    if (currentPage === "wardrobe") {
      if (isAuthed && wardrobeItems.length === 0) {
        setIsLoadingWardrobe(true);
      }
    } else {
      // Clear loading when navigating away
      setIsLoadingWardrobe(false);
    }
  }, [currentPage, isAuthed, wardrobeItems.length]);

  // Load chat history when entering chat and no sessions
  useEffect(() => {
    if (currentPage === "chat" && chatSessions.length === 0) {
      const userId = ensureUserId();
      (async () => {
        setIsLoadingChats(true);
        try {
          const hist = await fetchChatHistory(userId);

          // hist.chats is an array of chat docs returned by the backend. Each chat
          // doc includes an `id`, optional metadata (mode), and a `messages` array
          // (from the messages subcollection). We'll map each chat doc to an individual
          // sidebar session so chats are not merged.
          const sessions: ChatSession[] = (hist.chats || [])
            .filter((c: any) => {
              if (!c) return false;
              // Exclude wardrobe chats (explicit mode marker)
              if (c.mode === "wardrobe") return false;
              // Exclude structured wardrobe responses
              if (
                c.response &&
                Array.isArray(c.response.selected_item_ids) &&
                c.response.selected_item_ids.length > 0
              )
                return false;
              // Exclude legacy embedded selected_item_ids in text
              const replyText =
                (c.response && (c.response.reply || c.response.explain)) ||
                c.reply ||
                c.message ||
                "";
              if (typeof replyText === "string") {
                if (/"selected_item_ids"\s*:\s*\[/i.test(replyText))
                  return false;
                if (/selected_item_ids\s*[:=]/i.test(replyText)) return false;
              }
              return true;
            })
            .map((entry: any) => {
              const msgs: Message[] = [];

              // The backend returns messages as objects like { userMessage, response, timestamp }
              // Map each into the UI Message type (user/ai alternation)
              const rawMsgs = entry.messages || [];
              for (const m of rawMsgs) {
                if (m.userMessage)
                  msgs.push({
                    id: m.id || `${entry.id}-u-${msgs.length}`,
                    text: m.userMessage,
                    sender: "user",
                    timestamp: parseTimestamp(m.timestamp),
                  });
                if (m.response && (m.response.reply || m.response.explain))
                  msgs.push({
                    id: m.id ? `${m.id}-a` : `${entry.id}-a-${msgs.length}`,
                    text: m.response.reply || m.response.explain || "",
                    sender: "ai",
                    timestamp: parseTimestamp(m.timestamp),
                  });
              }

              // Back-compat: if legacy doc stored message/response fields directly, include them
              if (entry.message && entry.response && msgs.length === 0) {
                msgs.push({
                  id: `${entry.id}-legacy-u`,
                  text: entry.message,
                  sender: "user",
                  timestamp: parseTimestamp(entry.timestamp),
                });
                msgs.push({
                  id: `${entry.id}-legacy-a`,
                  text: entry.response.reply || entry.response.explain || "",
                  sender: "ai",
                  timestamp: parseTimestamp(entry.timestamp),
                });
              }

              const titleCandidate =
                (msgs.find((m) => m.sender === "user") || msgs[0])?.text ||
                entry.title ||
                "Chat";
              const title =
                titleCandidate.length > 40
                  ? titleCandidate.substring(0, 40) + "..."
                  : titleCandidate;

              return {
                id: entry.id,
                title,
                messages: msgs,
                createdAt: parseTimestamp(entry.createdAt),
                updatedAt: parseTimestamp(entry.updatedAt),
              } as ChatSession;
            })
            // sort by newest first
            .sort(
              (a: ChatSession, b: ChatSession) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );

          if (sessions.length > 0) {
            // Keep up to 3 sessions to match UI behavior
            setChatSessions(sessions.slice(0, 3));
            setCurrentChatSessionId(sessions[0].id);
            setIsLoadingChats(false);
          } else {
            await createNewChatSession();
            setIsLoadingChats(false);
          }
        } catch (err) {
          // fallback to local session creation if fetch fails
          await createNewChatSession();
          setIsLoadingChats(false);
        }
      })();
    }
  }, [currentPage]);

  if (showThankYou) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-rose-900 to-amber-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="inline-block animate-bounce mb-4">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p className="text-amber-100 opacity-90">Welcome to StylieAI</p>
        </div>
      </div>
    );
  }

  if (currentPage === "auth") {
    // Show the auth page - the global listener will handle routing after auth
    return (
      <Auth
        initialMode={authInitialMode}
        onAuthenticated={(mode) => {
          // Remember whether the user just signed up or signed in. The
          // auth listener will use this to decide whether to show the
          // profile setup screen (only after signup) or go to dashboard.
          console.log("Auth: Authentication successful, mode=", mode);
          lastAuthActionRef.current = mode;
          // The user explicitly performed an auth action (clicked sign-in/up)
          // — ensure the global auth listener treats this as an interactive
          // event and navigates away from the auth UI accordingly.
          forceShowAuthRef.current = true;
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!authHydrated && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-rose-900 to-amber-900 text-white">
          <div className="animate-pulse text-3xl mb-4">Loading ...</div>
          <div className="w-48 h-2 bg-white/20 rounded overflow-hidden">
            <div className="h-full w-1/3 bg-amber-300 animate-[loadingbar_1.2s_linear_infinite]"></div>
          </div>
        </div>
      )}
      {showLaunchLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-rose-900 to-amber-900 text-white">
          <div className="animate-pulse text-lg mb-4">
            Loading your style dashboard...
          </div>
          <div className="w-48 h-2 bg-white/20 rounded overflow-hidden">
            <div className="h-full w-1/3 bg-amber-300 animate-[loadingbar_1.2s_linear_infinite]"></div>
          </div>
          <style>{`@keyframes loadingbar { 0% { transform: translateX(-100%);} 100% { transform: translateX(300%);} }`}</style>
        </div>
      )}
      {currentPage === "welcome" && <WelcomePage onSignup={handleSignup} />}

      {currentPage === "setup" && (
        <PersonalInfoSetup onComplete={handleProfileComplete} />
      )}

      {currentPage === "edit-profile" && userProfile && (
        <PersonalInfoSetup
          onComplete={handleUpdateProfile}
          initialProfile={userProfile}
        />
      )}

      {isAuthed &&
        currentPage !== "welcome" &&
        currentPage !== "setup" &&
        currentPage !== "edit-profile" && (
          <>
            {currentPage === "dashboard" && (
              <Dashboard
                userProfile={userProfile!}
                wardrobeCount={wardrobeItems.length}
                onNavigate={setCurrentPage}
              />
            )}

            {currentPage === "wardrobe" && (
              <Wardrobe
                items={wardrobeItems}
                onAddItem={handleAddWardrobeItem}
                onDeleteItem={handleDeleteWardrobeItem}
                onNavigate={setCurrentPage}
                isLoading={isLoadingWardrobe}
              />
            )}

            {currentPage === "assist" && (
              <WardrobeAssist
                wardrobeItems={wardrobeItems}
                onNavigate={setCurrentPage}
              />
            )}

            {currentPage === "chat" && (
              <AIChatbot
                onNavigate={setCurrentPage}
                chatSessions={chatSessions}
                currentSessionId={currentChatSessionId}
                onCreateSession={createNewChatSession}
                onSwitchSession={switchChatSession}
                onDeleteSession={deleteChatSession}
                onUpdateSession={updateChatSession}
                userRegion={userProfile?.region}
                isLoadingChats={isLoadingChats}
              />
            )}

            {currentPage === "shopper" && (
              <ShopperAI onNavigate={setCurrentPage} />
            )}

            {currentPage === "makeup" && (
              <MakeupAI onNavigate={setCurrentPage} />
            )}

            {currentPage === "tips" && (
              <FashionTips onNavigate={setCurrentPage} />
            )}

            {currentPage === "profile" &&
              // Avoid rendering the Profile component until we've loaded the
              // user's profile data. Rendering it with a null/undefined
              // `userProfile` may cause runtime errors in props access.
              (isLoadingProfile || !userProfile ? (
                <div className="px-6 py-12 text-center text-gray-600">
                  Loading profile...
                </div>
              ) : (
                <Profile
                  userProfile={userProfile}
                  onNavigate={setCurrentPage}
                  onEditProfile={handleEditProfile}
                  onLogout={handleLogout}
                  isLoading={isLoadingProfile}
                />
              ))}

            <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
          </>
        )}
    </div>
  );
}
