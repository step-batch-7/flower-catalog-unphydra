const main = () => {
  const gif = document.querySelector('#canGif');
  gif.onclick = () => {
    gif.style.visibility = 'hidden';
    setTimeout(() => {
      gif.style.visibility = 'visible';
    }, 1000);
  };
};
