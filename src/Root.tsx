import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { LopsPromo } from "./LopsPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="LopsPromo"
        component={LopsPromo}
        durationInFrames={240}
        fps={24}
        width={540}
        height={960}
      />
    </>
  );
};
