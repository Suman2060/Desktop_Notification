import { useState, useEffect } from "react";

const TARGET_HOUR = 13;
const TARGET_MINUTE = 51;
const MESSAGE_TITLE = "Test Message";
const MESSAGE_BODY = "have a great tine";

const CHECK_INTERVAL_MS = 20000;

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const getPermission = () =>
  typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : "unsupported";

const getBlocker = () => {
  if (typeof window === "undefined") return "Not running in a browser.";
  if (!("Notification" in window))
    return "This browser does not support notifications.";
  if (!("serviceWorker" in navigator))
    return "This browser does not support Service Workers.";
  if (isIos() && !isStandalone())
    return "On iPhone or iPad, add this app to the Home Screen first.";
  return null;
};
const getRegistration = async () => {
  const registration =
    (await navigator.serviceWorker.getRegistration()) ||
    (await navigator.serviceWorker.register("/service-worker.js"));
  await navigator.serviceWorker.ready;
  return registration;
};

const pad = (n) => String(n).padStart(2, "0");

const formatTime = (hour, minute) =>
  `${hour % 12 || 12}:${pad(minute)} ${hour >= 12 ? "PM" : "AM"}`;

const getFireKey = () =>
  `${new Date().toDateString()}-${pad(TARGET_HOUR)}:${pad(TARGET_MINUTE)}`;

const readSent = () => {
  try {
    return localStorage.getItem("lastSentKey");
  } catch {
    return null;
  }
};

const writeSent = (key) => {
  try {
    localStorage.setItem("lastSentKey", key);
  } catch {
    //
  }
};

const NotificationPermission = () => {
  const [permission, setPermission] = useState(getPermission);
  const [status, setStatus] = useState("");

  const requestPermission = async () => {
    const blocker = getBlocker();

    if(blocker){
      setStatus(blocker);
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result)
    if(result !== "granted"){
      setStatus("Permission denied. Enable it in browser Setting")
    }
  };

  useEffect(() => {
    if (getBlocker()) return;
    if (isIos() && !isStandalone()) return;

    if (Notification.permission === "default") {
      Notification.requestPermission()
        .then(setPermission)
        .catch(() => {});
    }

    const check = async () => {
      if (Notification.permission !== "granted") return;

      const now = new Date();
      const target = new Date();
      target.setHours(TARGET_HOUR, TARGET_MINUTE, 0, 0);
      if (now < target) return;

      const key = getFireKey();
      if (readSent() === key) return;
      writeSent(key);

      try {
        const reg = await getRegistration();
        await reg.showNotification(MESSAGE_TITLE, {
          body: MESSAGE_BODY,
          icon: "/icon-192.png",
          badge: "/badge-72.png",
          tag: `scheduled-reminder-${key}`,
        });
      } catch (error) {
        try {
          localStorage.removeItem("lastSentKey");
        } catch {
          //
        }
        setStatus(`Could not display the notification: ${error.message}`);
      }
    };

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <div>
      <h1>Reminder</h1>
      <p>
        A notification will appear automatically at{" "}
        {formatTime(TARGET_HOUR, TARGET_MINUTE)} every day.
      </p>

      {permission === "default" && (
        <button type="button" onClick={requestPermission}>
          Allow notifications (one-time)
        </button>
      )}

      <p>Permission: {permission}</p>
      {status && <p role="status">{status}</p>}
    </div>
  );
};

export default NotificationPermission;
