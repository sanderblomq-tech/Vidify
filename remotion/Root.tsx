import { Composition } from "remotion";
import { ChatScreen, ChatScreenSchema, computeTotalDuration } from "./ChatScreen";

const FPS = 30;

const MOCK_MESSAGES = [
  { sender: "a" as const, text: "I know every drug on the street.", audioFile: "mock/0.mp3", durationSec: 1.5 },
  { sender: "b" as const, text: "And I have arrested every dealer.", audioFile: "mock/1.mp3", durationSec: 1.4 },
  { sender: "a" as const, text: "You have never caught me though.", audioFile: "mock/2.mp3", durationSec: 1.3 },
  { sender: "b" as const, text: "Give me one week.", audioFile: "mock/3.mp3", durationSec: 0.9 },
  { sender: "a" as const, text: "You said that last year too.", audioFile: "mock/4.mp3", durationSec: 1.5 },
  { sender: "b" as const, text: "Fair point.", audioFile: "mock/5.mp3", durationSec: 0.8 },
];

const MOCK_TOTAL_SEC = computeTotalDuration(MOCK_MESSAGES);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VidifyChat"
      component={ChatScreen}
      durationInFrames={Math.round(MOCK_TOTAL_SEC * FPS)}
      fps={FPS}
      width={1080}
      height={1920}
      schema={ChatScreenSchema}
      defaultProps={{
        title: "Who Knows The Streets Better?",
        characterA: "Dealer 💊",
        characterB: "Police 🚔",
        messages: MOCK_MESSAGES,
        hasBgVideo: false,
      }}
      calculateMetadata={async ({ props }) => {
        const totalSec = computeTotalDuration(props.messages);
        return {
          durationInFrames: Math.max(1, Math.round(totalSec * FPS)),
        };
      }}
    />
  );
};
