// import sound from '../assets/zug-zug.mp3';
// import benSound from '../assets/zug-a-zug-ah.mp3';

export const getNotificationSound = async (name?: string) => {
  let sound;
  if (name && ['Ben', 'bendeforest'].includes(name)) {
    sound = await import('../assets/hbd.mp3');
  } else {
    sound = await import('../assets/zug-zug.mp3');
  }
  return sound.default;
};
