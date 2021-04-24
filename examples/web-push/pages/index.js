import { useEffect, useState } from "react";
import Head from "next/head";

import { useUser } from "../lib/hooks";
import Layout from "../components/layout";

import { Experiment, Variation } from "react-tesfy";
import { getTesfyProps } from "../utils";

export const getServerSideProps = getTesfyProps(async () => {
  return { props: {} };
});

const base64ToUint8Array = (base64) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(b64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [registration, setRegistration] = useState(null);

  const user = useUser();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      // run only in browser
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (
            sub &&
            !(
              sub.expirationTime &&
              Date.now() > sub.expirationTime - 5 * 60 * 1000
            )
          ) {
            setSubscription(sub);
            setIsSubscribed(true);
          }
        });
        setRegistration(reg);
      });
    }
  }, []);

  const subscribeButtonOnClick = async (event) => {
    event.preventDefault();
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(
        process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY
      ),
    });
    // TODO: you should call your API to save subscription data on server in order to send web push notification from server
    setSubscription(sub);
    setIsSubscribed(true);
    console.log("web push subscribed!");
    console.log(sub);
  };

  const unsubscribeButtonOnClick = async (event) => {
    event.preventDefault();
    await subscription.unsubscribe();
    // TODO: you should call your API to delete or invalidate subscription data on server
    setSubscription(null);
    setIsSubscribed(false);
    console.log("web push unsubscribed!");
  };

  const sendNotificationButtonOnClick = async (event) => {
    event.preventDefault();
    if (subscription == null) {
      console.error("web push not subscribed");
      return;
    }

    await fetch("/api/notification", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        subscription,
      }),
    });
  };

  return (
    <>
      <Head>
        <title>Best Pwa mix</title>
      </Head>
      <Layout>
        <h1>Experiments</h1>

        <section>
          <h2>Experiment 1 - Allocation</h2>
          <Experiment id="experiment-1">
            <Variation>
              <p style={{ color: "yellow" }}>Yellow</p>
            </Variation>
            <Variation id="0">
              <p style={{ color: "blue" }}>Blue</p>
            </Variation>
            <Variation id="1">
              <p style={{ color: "red" }}>Red</p>
            </Variation>
          </Experiment>
        </section>

        <section>
          <h2>Experiment 2 - Audience</h2>
          <Experiment id="experiment-2" attributes={{ countryCode: "us" }}>
            <Variation>
              <p style={{ fontWeight: "bold" }}>Bold</p>
            </Variation>
            <Variation id="0">
              <p>Normal</p>
            </Variation>
          </Experiment>
        </section>

        <h1>Next.js + PWA = AWESOME!</h1>
        <button onClick={subscribeButtonOnClick} disabled={isSubscribed}>
          Subscribe
        </button>
        <button onClick={unsubscribeButtonOnClick} disabled={!isSubscribed}>
          Unsubscribe
        </button>
        <button
          onClick={sendNotificationButtonOnClick}
          disabled={!isSubscribed}
        >
          Send Notification
        </button>

        <h1>Magic Example</h1>

        <p>Steps to test this authentication example:</p>

        <ol>
          <li>Click Login and enter an email.</li>
          <li>
            You'll be redirected to Home. Click on Profile, notice how your
            session is being used through a token stored in a cookie.
          </li>
          <li>
            Click Logout and try to go to Profile again. You'll get redirected
            to Login.
          </li>
        </ol>

        <p>
          To learn more about Magic, visit their{" "}
          <a
            href="https://docs.magic.link/"
            target="_blank"
            rel="noopener noreferrer"
          >
            documentation
          </a>
          .
        </p>

        {user && (
          <>
            <p>Currently logged in as:</p>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </>
        )}

        <style jsx>{`
          li {
            margin-bottom: 0.5rem;
          }
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        `}</style>
      </Layout>
    </>
  );
};
