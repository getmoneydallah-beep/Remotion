import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { LopsPromo } from "./LopsPromo";
import { FinanceReel } from "./finance/FinanceReel";
import { CapitalFilm } from "./capital/CapitalFilm";
import { ClimaxProto } from "./capital3d/Climax";
import { Film3D } from "./capital3d/Film3D";
import { FitPilot } from "./fit/FitPilot";
import { BackReel } from "./fit/BackReel";
import { WorkoutReel } from "./fit/WorkoutReel";
import { LEGS } from "./fit/legs";
import { BACK } from "./fit/back";
import { SMITH } from "./fit/smith";
import { GLUTES } from "./fit/glutes";
import { CHEST } from "./fit/chest";
import { BICEPS } from "./fit/biceps";
import { REARDELT } from "./fit/reardelt";
import { ABS } from "./fit/abs";
import { RECOVERY } from "./fit/recovery";
import { LATS } from "./fit/lats";

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
      <Composition id="ClimaxProto" component={ClimaxProto} durationInFrames={120} fps={24} width={1080} height={1920} defaultProps={{ offset: 0 }} />
      <Composition id="Film3D" component={Film3D} durationInFrames={945} fps={30} width={1080} height={1920} />
      <Composition id="Film3DDraft" component={Film3D} durationInFrames={756} fps={24} width={1080} height={1920} />
      <Composition id="FitPilot" component={FitPilot} durationInFrames={276} fps={30} width={1080} height={1920} />
      <Composition id="BackReel" component={BackReel} durationInFrames={1110} fps={30} width={1080} height={1920} />
      <Composition id="LegsReel" component={WorkoutReel} durationInFrames={1110} fps={30} width={1080} height={1920} defaultProps={{ config: LEGS }} />
      <Composition id="BackReelGrams" component={WorkoutReel} durationInFrames={1200} fps={30} width={1080} height={1920} defaultProps={{ config: BACK }} />
      <Composition id="SmithReel" component={WorkoutReel} durationInFrames={1065} fps={30} width={1080} height={1920} defaultProps={{ config: SMITH }} />
      <Composition id="GlutesReel" component={WorkoutReel} durationInFrames={1059} fps={30} width={1080} height={1920} defaultProps={{ config: GLUTES }} />
      <Composition id="ChestReel" component={WorkoutReel} durationInFrames={1275} fps={30} width={1080} height={1920} defaultProps={{ config: CHEST }} />
      <Composition id="BicepsReel" component={WorkoutReel} durationInFrames={1200} fps={30} width={1080} height={1920} defaultProps={{ config: BICEPS }} />
      <Composition id="RearDeltReel" component={WorkoutReel} durationInFrames={1125} fps={30} width={1080} height={1920} defaultProps={{ config: REARDELT }} />
      <Composition id="AbsReel" component={WorkoutReel} durationInFrames={1155} fps={30} width={1080} height={1920} defaultProps={{ config: ABS }} />
      <Composition id="RecoveryReel" component={WorkoutReel} durationInFrames={1134} fps={30} width={1080} height={1920} defaultProps={{ config: RECOVERY }} />
      <Composition id="LatsReel" component={WorkoutReel} durationInFrames={1101} fps={30} width={1080} height={1920} defaultProps={{ config: LATS }} />
    </>
  );
};
