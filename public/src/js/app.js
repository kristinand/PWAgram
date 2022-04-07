var deferredPrompt;
const ntificationsButtons = document.querySelectorAll(".enable-notifications");

// Check if service workers supported by browser
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .then(() => {
      console.log("SW registered");
    })
    .catch((err) => {
      console.log(err);
    });
}

window.addEventListener("beforeinstallprompt", (event) => {
  console.log("beforeinstallprompt fired");
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification() {
  if ("serviceWorker" in navigator) {
    const options = {
      body: "You successfully subscribet to our service!",
      icon: "/src/images/icons/app-icon-96x96.png",
      image: "/src/images/sf-boad.jpg",
      dir: "ltr",
      lang: "en-US",
      vibrate: [100, 50, 200],
      badge: "/src/images/icons/app-icon-96x96.png",
      tag: "confirm-notification",
      renotify: true,
      actions: [
        {
          action: "confirm",
          title: "OK",
          icon: "/src/images/icons/app-icon-96x96.png",
        },
        {
          action: "cancel",
          title: "Cancel",
          icon: "/src/images/icons/app-icon-96x96.png",
        },
      ],
    };

    navigator.serviceWorker.ready.then((swReg) => {
      swReg.showNotification("Successfully subscribed!", options);
    });
  }
}

function configurePushSub() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  let reg;
  navigator.serviceWorker.ready
    .then((swReg) => {
      reg = swReg;
      return swReg.pushManager.getSubscription();
    })
    .then((sub) => {
      if (sub === null) {
        // create new sub

        const vapidPublicKey =
          "BG-N1aBDrLMPN2mk8BbWluEp7WC2SawW6dLyfmkOu09ghVRIX7AZC6S25c2pt0PfKdzQ9x1fsabgS79JSGqzLx8";
        const convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);

        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey,
        });
      }
    })
    .then((newSub) => {
      return fetch(
        "https://mypwa-a912b-default-rtdb.europe-west1.firebasedatabase.app/subscribtions.json",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(newSub),
        }
      );
    })
    .then((res) => {
      if (res.ok) {
        displayConfirmNotification();
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

function askForNotificationPermission() {
  Notification.requestPermission((result) => {
    if (result !== "granted") {
      console.log("No granted permission :(");
    } else {
      // displayConfirmNotification();
      configurePushSub();
      // Hide button
    }
  });
}

if ("Notification" in window && "serviceWorker" in navigator) {
  ntificationsButtons.forEach((button) => {
    button.style.display = "inline-block";
    button.addEventListener("click", askForNotificationPermission);
  });
}
