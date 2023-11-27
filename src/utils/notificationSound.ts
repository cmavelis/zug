// import sound from '../assets/zug-zug.mp3';
// import benSound from '../assets/zug-a-zug-ah.mp3';

export const getNotificationSound = async (isBen: boolean) => {
  let sound;
  if (isBen) {
    sound = await import('../assets/zug-a-zug-ah.mp3');
  } else {
    sound = await import('../assets/zug-zug.mp3');
  }
  return sound.default;
};
