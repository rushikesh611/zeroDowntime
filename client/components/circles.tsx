import { Pause } from "lucide-react";

const Circles = ({ isPaused = false }) => {
  return (
    <div className="relative h-11 w-11">
      {isPaused ? (
        <Pause  className="h-11 w-11 text-yellow-500"/>
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