import { Composition } from "remotion";
import { ChatScreen, ChatScreenSchema, computeTotalDuration } from "./ChatScreen";

const FPS = 30;

const MOCK_MESSAGES = [
  { sender: "a" as const, text: "Two hundred a month. Starting small.", audioFile: "mock/0.mp3", durationSec: 1.2 },
  { sender: "b" as const, text: "Just graduated. Two thousand a month.", audioFile: "mock/1.mp3", durationSec: 1.3 },
  { sender: "a" as const, text: "Six months. Eight hundred now.", audioFile: "mock/2.mp3", durationSec: 1.1 },
  { sender: "b" as const, text: "Still training. Rent is covered though.", audioFile: "mock/3.mp3", durationSec: 1.3 },
  { sender: "a" as const, text: "One year. Ten K a month.", audioFile: "mock/4.mp3", durationSec: 1.1 },
  { sender: "b" as const, text: "Patrol. Two point two K.", audioFile: "mock/5.mp3", durationSec: 1.1 },
  { sender: "a" as const, text: "Year three. Thirty K. You still stuck?", audioFile: "mock/6.mp3", durationSec: 1.4 },
  { sender: "b" as const, text: "Made detective. Three point four K.", audioFile: "mock/7.mp3", durationSec: 1.3 },
  { sender: "a" as const, text: "Detective? I made more last Tuesday.", audioFile: "mock/8.mp3", durationSec: 1.3 },
  { sender: "b" as const, text: "Funny. What were you doing last Tuesday?", audioFile: "mock/9.mp3", durationSec: 1.4 },
  { sender: "a" as const, text: "Five years. I run the whole east side.", audioFile: "mock/10.mp3", durationSec: 1.4 },
  { sender: "b" as const, text: "Five years. I just signed your arrest warrant.", audioFile: "mock/11.mp3", durationSec: 1.8 },
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
        title: "Who Makes More Money In 5 Years?",
        characterA: "Criminal 💰",
        characterB: "Police 🚔",
        messages: MOCK_MESSAGES,
        twistIndex: 9,
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
