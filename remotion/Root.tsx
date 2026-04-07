import { Composition } from "remotion";
import { ChatScreen, ChatScreenSchema, computeTotalDuration } from "./ChatScreen";

const FPS = 30;

const MOCK_MESSAGES = [
  { sender: "a" as const, text: "I am making two hundred a month right now.", audioFile: "mock/0.mp3", durationSec: 1.4 },
  { sender: "b" as const, text: "I just graduated police school. Two thousand a month.", audioFile: "mock/1.mp3", durationSec: 1.5 },
  { sender: "a" as const, text: "Six months in. Moving product. Eight hundred now.", audioFile: "mock/2.mp3", durationSec: 1.4 },
  { sender: "b" as const, text: "Still training. But my rent is covered.", audioFile: "mock/3.mp3", durationSec: 1.3 },
  { sender: "a" as const, text: "One year in. Ten K a month from shipments.", audioFile: "mock/4.mp3", durationSec: 1.4 },
  { sender: "b" as const, text: "I am on patrol. Two point two K.", audioFile: "mock/5.mp3", durationSec: 1.3 },
  { sender: "a" as const, text: "Year three. Thirty K a month. You still stuck?", audioFile: "mock/6.mp3", durationSec: 1.4 },
  { sender: "b" as const, text: "I made detective. Three point four K now.", audioFile: "mock/7.mp3", durationSec: 1.3 },
  { sender: "a" as const, text: "Detective? I made more last Tuesday.", audioFile: "mock/8.mp3", durationSec: 1.3 },
  { sender: "b" as const, text: "Interesting. What were you doing last Tuesday?", audioFile: "mock/9.mp3", durationSec: 1.4 },
  { sender: "a" as const, text: "Five years in. I run the whole east side.", audioFile: "mock/10.mp3", durationSec: 1.4 },
  { sender: "b" as const, text: "Five years in. I just signed the warrant for the east side. Who won?", audioFile: "mock/11.mp3", durationSec: 1.9 },
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
