import { displayCards } from './utils/cardFunctions';
import { readAllData, writeData } from './utils/indexedDBFunctions';
import { ICard } from './types';

const url =
  'https://mypwa-a912b-default-rtdb.europe-west1.firebasedatabase.app/posts.json';

const form: HTMLFormElement = document.querySelector('form');
const shareImageButton: HTMLButtonElement = document.querySelector(
  '#share-image-button'
);
const createPostArea: HTMLDivElement = document.querySelector('#create-post');
const closeCreatePostModalButton: HTMLButtonElement = document.querySelector(
  '#close-create-post-modal-button'
);

function openCreatePostModal() {
  createPostArea.style.transform = 'translateY(0)';
  // if (deferredPrompt) {
  //   deferredPrompt.prompt();

  //   deferredPrompt.userChoice.then((choiceResult) => {
  //     console.log(choiceResult.outcome);

  //     if (choiceResult.outcome === 'dismissed') {
  //       console.log('User cancelled installation');
  //     } else {
  //       console.log('User added to home screen');
  //     }
  //   });

  //   deferredPrompt = null;
  // }
}

function closeCreatePostModal() {
  createPostArea.style.transform = 'translateY(100vh)';
}

shareImageButton.addEventListener('click', openCreatePostModal);
closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

let networkDataRecieved = false;

fetch(url)
  .then((res) => res.json())
  .then((data) => {
    networkDataRecieved = true;
    console.log('From web', data);
    displayCards(data);
  });

if ('indexedDB' in window) {
  readAllData('posts').then((data: ICard[]) => {
    if (!networkDataRecieved) {
      console.log('From cache', data);
      displayCards(data, true);
    }
  });
}

function sendData(data: ICard) {
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data),
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const title: HTMLInputElement = document.querySelector('#title');
  const location: HTMLInputElement = document.querySelector('#location');

  if (!title.value.trim() || !location.value.trim()) {
    alert('Please enter valid data!');
    return;
  }

  closeCreatePostModal();

  const post: ICard = {
    id: new Date().toISOString(),
    title: title.value,
    location: location.value,
    image: '',
  };

  // if ('serviceWorker' in navigator && 'SyncManager' in window) {
  //   navigator.serviceWorker.ready.then((sw) => {
  //     writeData('sync-posts', post)
  //       .then(() => {
  //         // @ts-ignore
  //         sw.sync.register('sync-new-post');
  //       })
  //       .then(() => {
  //         const snackbarContainer: HTMLDivElement = document.querySelector(
  //           '#confirmation-toast'
  //         );
  //         const data = { message: 'Your post was saved for syncing!' };
  //         // @ts-ignore
  //         snackbarContainer.MaterialSnackbar.showSnackbar(data);
  //       })
  //       .catch((err: Error) => {
  //         console.log(err);
  //       });
  //   });
  // } else {
  //   sendData(post);
  // }
});
