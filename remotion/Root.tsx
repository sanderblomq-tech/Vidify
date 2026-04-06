import { Composition } from "remotion";
import { ChatScreen, ChatScreenSchema } from "./ChatScreen";

const FPS = 30;

const MOCK_MESSAGES = [
  { sender: "them" as const, text: "yo can i borrow ur car", audioFile: "mock/0.mp3", durationSec: 1.5 },
  { sender: "me" as const, text: "for what", audioFile: "mock/1.mp3", durationSec: 0.8 },
  { sender: "them" as const, text: "just a quick errand", audioFile: "mock/2.mp3", durationSec: 1.2 },
  { sender: "me" as const, text: "last time u said that", audioFile: "mock/3.mp3", durationSec: 1.5 },
  { sender: "me" as const, text: "u came back 3 days later", audioFile: "mock/4.mp3", durationSec: 1.8 },
  { sender: "them" as const, text: "that was different 😭", audioFile: "mock/5.mp3", durationSec: 1.3 },
];

const GAP_SEC = 0.45;
const MOCK_TOTAL_SEC = MOCK_MESSAGES.reduce((s, m) => s + m.durationSec, 0)
  + MOCK_MESSAGES.length * GAP_SEC + 1;

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
        contactName: "Bestie 🤡",
        messages: MOCK_MESSAGES,
        hasBgVideo: false,
      }}
      calculateMetadata={async ({ props }) => {
        const totalSec =
          props.messages.reduce((s, m) => s + m.durationSec, 0) +
          props.messages.length * GAP_SEC +
          1;
        return {
          durationInFrames: Math.max(1, Math.round(totalSec * FPS)),
        };
      }}
    />
  );
};
