const sec = 1000;
// eslint-disable-next-line no-unused-vars
const main = () => {
  const gif = document.querySelector('#canGif');
  gif.onclick = () => {
    gif.style.visibility = 'hidden';
    setTimeout(() => {
      gif.style.visibility = 'visible';
    }, sec);
  };
};
