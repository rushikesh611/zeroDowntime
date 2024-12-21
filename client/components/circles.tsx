const Circles = ({ isPaused = false }) => {
  return (
    <div className="relative h-11 w-11">
      {isPaused ? (
        <>
        <div className="absolute h-11 w-11 rounded-full bg-yellow-500 opacity-0 animate-growAndFade delay-1000"></div>
        <div className="absolute h-11 w-11 rounded-full bg-yellow-500 opacity-0 animate-growAndFade delay-2000"></div>
        <div className="absolute h-11 w-11 rounded-full bg-yellow-500 opacity-0 animate-growAndFade delay-3000"></div>
      </>
      ) : (
        <>
          <div className="absolute h-11 w-11 rounded-full bg-green-500 opacity-0 animate-growAndFade delay-1000"></div>
          <div className="absolute h-11 w-11 rounded-full bg-green-500 opacity-0 animate-growAndFade delay-2000"></div>
          <div className="absolute h-11 w-11 rounded-full bg-green-500 opacity-0 animate-growAndFade delay-3000"></div>
        </>
      )}
    </div>
  );
};

export default Circles;