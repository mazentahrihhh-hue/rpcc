import { findByProps } from "@vendetta/metro";
import { ReactNative as RN } from "@metro/common";
import { React } from "@metro/common";
import { getData, setData } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";

const FluxDispatcher = findByProps("dispatch");
const { View, Text, TextInput, ScrollView, Pressable, Switch } = RN;

const defaults = {
  applicationId: "",
  name: "Call of Duty: Modern Warfare 2",
  details: "",
  state: "",
  largeImage: "",
  largeText: "",
  smallImage: "",
  smallText: "",
  type: 0,
  showTimestamp: true,
  button1: "",
  url1: "",
  button2: "",
  url2: "",
};

let config = { ...defaults, ...(getData("config") || {}) };
let startTime = Date.now();

function save() {
  setData("config", config);
}

function updatePresence() {
  if (!config.applicationId) {
    showToast("Enter a Discord Application ID first.");
    return;
  }

  const activity = {
    application_id: config.applicationId,
    name: config.name || "Custom Rich Presence",
    type: Number(config.type) || 0,
    details: config.details || undefined,
    state: config.state || undefined,
    timestamps: config.showTimestamp ? { start: startTime } : undefined,
    assets: (config.largeImage || config.smallImage) ? {
      large_image: config.largeImage || undefined,
      large_text: config.largeText || undefined,
      small_image: config.smallImage || undefined,
      small_text: config.smallText || undefined,
    } : undefined,
  };

  const buttons = [];
  const buttonUrls = [];
  if (config.button1 && config.url1) {
    buttons.push(config.button1);
    buttonUrls.push(config.url1);
  }
  if (config.button2 && config.url2) {
    buttons.push(config.button2);
    buttonUrls.push(config.url2);
  }
  if (buttons.length) {
    activity.buttons = buttons;
    activity.metadata = { button_urls: buttonUrls };
  }

  FluxDispatcher.dispatch({
    type: "LOCAL_ACTIVITY_UPDATE",
    socketId: "mw2-rich-presence",
    activity,
  });

  showToast("Rich Presence updated.");
}

function clearPresence() {
  FluxDispatcher.dispatch({
    type: "LOCAL_ACTIVITY_UPDATE",
    socketId: "mw2-rich-presence",
    activity: null,
  });
  showToast("Rich Presence cleared.");
}

function Field({ label, keyName, placeholder }) {
  return React.createElement(View, { style: { marginBottom: 14 } },
    React.createElement(Text, { style: { color: "#fff", fontSize: 14, marginBottom: 6 } }, label),
    React.createElement(TextInput, {
      value: config[keyName] ?? "",
      placeholder,
      placeholderTextColor: "#777",
      onChangeText: (v) => { config[keyName] = v; save(); },
      style: {
        backgroundColor: "#1f2023",
        color: "#fff",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }
    })
  );
}

function Action({ text, onPress }) {
  return React.createElement(Pressable, {
    onPress,
    style: { backgroundColor: "#5865F2", padding: 12, borderRadius: 8, marginBottom: 10 }
  }, React.createElement(Text, { style: { color: "#fff", textAlign: "center", fontWeight: "700" } }, text));
}

function Settings() {
  const [, force] = React.useState(0);
  const refresh = () => force(x => x + 1);

  return React.createElement(ScrollView, { style: { flex: 1, padding: 16 } },
    React.createElement(Text, { style: { color:"#fff", fontSize:22, fontWeight:"800", marginBottom:18 } }, "MW2 Rich Presence"),
    React.createElement(Text, { style: { color:"#aaa", marginBottom:18 } },
      "غيّر كل الحقول بنفسك. الصور يجب أن تكون أسماء Art Assets داخل تطبيق Discord Developer."
    ),

    React.createElement(Field, { label:"Application ID", keyName:"applicationId", placeholder:"123456789012345678" }),
    React.createElement(Field, { label:"Name / اللعبة", keyName:"name", placeholder:"اسم اللعبة" }),
    React.createElement(Field, { label:"Details", keyName:"details", placeholder:"السطر الأول" }),
    React.createElement(Field, { label:"State", keyName:"state", placeholder:"السطر الثاني" }),
    React.createElement(Field, { label:"Large Image Key", keyName:"largeImage", placeholder:"large_image_key" }),
    React.createElement(Field, { label:"Large Image Text", keyName:"largeText", placeholder:"النص عند الضغط/التحويم" }),
    React.createElement(Field, { label:"Small Image Key", keyName:"smallImage", placeholder:"small_image_key" }),
    React.createElement(Field, { label:"Small Image Text", keyName:"smallText", placeholder:"نص الصورة الصغيرة" }),

    React.createElement(View, { style:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:16 } },
      React.createElement(Text,{style:{color:"#fff"}}, "Show elapsed time"),
      React.createElement(Switch,{
        value: !!config.showTimestamp,
        onValueChange:(v)=>{config.showTimestamp=v; save(); refresh();}
      })
    ),

    React.createElement(Field, { label:"Button 1 text", keyName:"button1", placeholder:"Open Game" }),
    React.createElement(Field, { label:"Button 1 URL", keyName:"url1", placeholder:"https://..." }),
    React.createElement(Field, { label:"Button 2 text", keyName:"button2", placeholder:"Website" }),
    React.createElement(Field, { label:"Button 2 URL", keyName:"url2", placeholder:"https://..." }),

    React.createElement(Action, { text:"▶ Start / Update Presence", onPress:updatePresence }),
    React.createElement(Action, { text:"■ Clear Presence", onPress:clearPresence }),
    React.createElement(Action, { text:"↻ Reset fields", onPress:()=>{config={...defaults};startTime=Date.now();save();refresh();} }),
  );
}

export default {
  onLoad() {
    config = { ...defaults, ...(getData("config") || {}) };
    startTime = Date.now();
  },
  onUnload() {
    clearPresence();
  },
  settings: {
    render: Settings,
  },
};
