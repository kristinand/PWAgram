import { ICard } from '../types';

const sharedMomentsArea: HTMLDivElement =
  document.querySelector('#shared-moments');

// const onSaveButtonClicked = () => {
//   if ('caches' in window) {
//     caches.open('user-requested').then((cache) => {
//       cache.add('https://httpbin.org/get');
//       cache.add('/src/images/sf-boat.jpg');
//     });
//   }
// };

const createCard = ({ image, title, location }: ICard) => {
  const cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';

  const cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = `url(${image})`;
  cardTitle.style.backgroundSize = 'cover';

  cardWrapper.appendChild(cardTitle);

  const cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = title;

  cardTitle.appendChild(cardTitleTextElement);

  const cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = location;
  cardSupportingText.style.textAlign = 'center';

  // const cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);\

  cardWrapper.appendChild(cardSupportingText);

  // global, from material
  // @ts-ignore
  componentHandler!.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
};

const clearCards = () => {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
};

export const displayCards = (
  data: ICard[] | { [key: string]: ICard },
  isArray = false
) => {
  clearCards();
  const cards = isArray ? (data as ICard[]) : Object.values(data);

  if (cards) {
    cards.forEach((card) => createCard(card));
  }
};
