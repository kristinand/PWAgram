var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var webpush = require("web-push");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

var serviceAccount = require("./pwagram-fb-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://mypwa-a912b-default-rtdb.europe-west1.firebasedatabase.app/",
});

exports.storePostData = functions.https.onRequest((request, response) => {
  cors({ body }, response, () => {
    admin
      .database()
      .ref("posts")
      .push({
        id: body.id,
        title: body.title,
        location: body.location,
        image: body.image,
      })
      .then(() => {
        webpush.setVapidDetails(
          "mailto:tabbyk@ya.ru",
          "BG-N1aBDrLMPN2mk8BbWluEp7WC2SawW6dLyfmkOu09ghVRIX7AZC6S25c2pt0PfKdzQ9x1fsabgS79JSGqzLx8",
          process.env.PRIVATE_KEY
        );
        return admin.database().ref("subscriptions").once("value");
      })
      .then((subscriptions) => {
        subscriptions.forEach((sub) => {
          const { keys, endpoint } = sub.val();

          const pushConfig = {
            endpoint: endpoint,
            keys: {
              auth: keys.auth,
              p256dh: keys.p256dh,
            },
          };

          webpush
            .sendNotification(
              pushConfig,
              JSON.stringify({
                title: "New Post",
                content: "New Post added!",
                openUrl: "/help.html"
              })
            )
            .catch(console.log);
        });
        response
          .status(201)
          .json({ message: "Data stored", id: request.body.id });
      })
      .catch((err) => {
        response.status(500).json({ error: err });
      });
  });
});
