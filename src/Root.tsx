import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { LopsPromo } from "./LopsPromo";
import { FinanceReel } from "./finance/FinanceReel";
import { CapitalFilm } from "./capital/CapitalFilm";

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
      <Composition
        id="FinanceReel"
        component={FinanceReel}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="FinanceReelDraft"
        component={FinanceReel}
        durationInFrames={720}
        fps={24}
        width={1080}
        height={1920}
      />
      <Composition id="CapitalFilm" component={CapitalFilm} durationInFrames={900} fps={30} width={1080} height={1920} defaultProps={{ from: 0 }} />
      <Composition id="CapitalFilmDraft" component={CapitalFilm} durationInFrames={720} fps={24} width={1080} height={1920} defaultProps={{ from: 0 }} />
    </>
  );
};
