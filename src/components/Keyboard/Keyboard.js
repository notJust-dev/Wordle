import { View, Text, Pressable } from "react-native";
import { keys, ENTER, CLEAR, colors } from "../../constants";
import styles, { keyWidth } from "./Keyboard.styles";

const Keyboard = ({
  onKeyPressed = () => {},
  greenCaps = [],
  yellowCaps = [],
  greyCaps = [],
}) => {
  const isLongButton = (key) => {
    return key === ENTER || key === CLEAR;
  };

  const getKeyBGColor = (key) => {
    if (greenCaps.includes(key)) {
      return colors.primary;
    }
    if (yellowCaps.includes(key)) {
      return colors.secondary;
    }
    if (greyCaps.includes(key)) {
      return colors.darkgrey;
    }
    return colors.grey;
  };

  return (
    <View style={styles.keyboard}>
      {keys.map((keyRow, i) => (
        <View style={styles.row} key={`row-${i}`}>
          {keyRow.map((key) => (
            <Pressable
              onPress={() => onKeyPressed(key)}
              disabled={greyCaps.includes(key)}
              key={key}
              style={[
                styles.key,
                isLongButton(key) ? { width: keyWidth * 1.4 } : {},
                { backgroundColor: getKeyBGColor(key) },
              ]}
            >
              <Text style={styles.keyText}>{key.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
};

export default Keyboard;
