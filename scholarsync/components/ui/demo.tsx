import React from "react";
import { View, ScrollView } from "react-native";
import { Hero1 } from "./hero-1";
import { AIChatInput } from "./ai-chat-input";
import { useTheme } from "../../context/ThemeContext";

const DemoPage = () => {
  const { colors } = useTheme();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bgPrimary }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Full Section 1: Hero */}
        <View style={{ height: 600 }}>
          <Hero1 />
        </View>

        {/* Section 2: Interactive Input Demo */}
        <View className="p-6 items-center justify-center bg-transparent mt-[-50]">
          <AIChatInput 
            onSendMessage={(data) => {
              console.log("Demo Message Sent:", data.message);
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

// REQUIRED FORMAT: export default { DemoOne }
export default { 
  DemoOne: DemoPage 
};
