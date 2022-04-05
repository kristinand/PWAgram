import './feed';

const myNavigator: any = navigator;

// Check if service workers supported by browser
if ('serviceWorker' in myNavigator) {
  myNavigator.serviceWorker
    .register('/sw.js')
    .then(() => {
      console.log('SW registered');
    })
    .catch((err: Error) => {
      console.log(err);
    });
}

// Example of unregistering
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.getRegistrations().then((registrations) => {
//     for (let i = 0; i < registrations.length; i++) {
//       registrations[i].unregister();
//     }
//   });
// }
