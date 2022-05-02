import { useEffect, useState } from "react";
import { Text, View, ScrollView, Alert, ActivityIndicator } from "react-native";
import { colors, CLEAR, ENTER, colorsToEmoji } from "../../constants";
import Keyboard from "../Keyboard";
import words from "../../words";
import styles from "./Game.styles";
import { copyArray, getDayOfTheYear, getDayKey } from "../../utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EndScreen from "../EndScreen";
import Animated, {
  SlideInDown,
  SlideInLeft,
  ZoomIn,
  FlipInEasyY,
} from "react-native-reanimated";

const NUMBER_OF_TRIES = 6;

const dayOfTheYear = getDayOfTheYear();
const dayKey = getDayKey();

const Game = () => {
  // AsyncStorage.removeItem("@game");
  const word = words[dayOfTheYear];
  const letters = word.split(""); // ['h', 'e', 'l', 'l', 'o']

  const [rows, setRows] = useState(
    new Array(NUMBER_OF_TRIES).fill(new Array(letters.length).fill(""))
  );
  const [curRow, setCurRow] = useState(0);
  const [curCol, setCurCol] = useState(0);
  const [gameState, setGameState] = useState("playing"); // won, lost, playing
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (curRow > 0) {
      checkGameState();
    }
  }, [curRow]);

  useEffect(() => {
    if (loaded) {
      persistState();
    }
  }, [rows, curRow, curCol, gameState]);

  useEffect(() => {
    readState();
  }, []);

  const persistState = async () => {
    // write all the state variables in async storage
    const dataForToday = {
      rows,
      curRow,
      curCol,
      gameState,
    };

    try {
      const existingStateString = await AsyncStorage.getItem("@game");
      const existingState = existingStateString
        ? JSON.parse(existingStateString)
        : {};

      existingState[dayKey] = dataForToday;

      const dataString = JSON.stringify(existingState);
      await AsyncStorage.setItem("@game", dataString);
    } catch (e) {
      console.log("Failed to write data to async storage", e);
    }
  };

  const readState = async () => {
    const dataString = await AsyncStorage.getItem("@game");
    try {
      const data = JSON.parse(dataString);
      const day = data[dayKey];
      setRows(day.rows);
      setCurCol(day.curCol);
      setCurRow(day.curRow);
      setGameState(day.gameState);
    } catch (e) {
      console.log("Couldn't parse the sate");
    }

    setLoaded(true);
  };

  const checkGameState = () => {
    if (checkIfWon() && gameState !== "won") {
      setGameState("won");
    } else if (checkIfLost() && gameState !== "lost") {
      setGameState("lost");
    }
  };

  const checkIfWon = () => {
    const row = rows[curRow - 1];

    return row.every((letter, i) => letter === letters[i]);
  };

  const checkIfLost = () => {
    return !checkIfWon() && curRow === rows.length;
  };

  const onKeyPressed = (key) => {
    if (gameState !== "playing") {
      return;
    }

    const updatedRows = copyArray(rows);

    if (key === CLEAR) {
      const prevCol = curCol - 1;
      if (prevCol >= 0) {
        updatedRows[curRow][prevCol] = "";
        setRows(updatedRows);
        setCurCol(prevCol);
      }
      return;
    }

    if (key === ENTER) {
      if (curCol === rows[0].length) {
        setCurRow(curRow + 1);
        setCurCol(0);
      }

      return;
    }

    if (curCol < rows[0].length) {
      updatedRows[curRow][curCol] = key;
      setRows(updatedRows);
      setCurCol(curCol + 1);
    }
  };

  const isCellActive = (row, col) => {
    return row === curRow && col === curCol;
  };

  const getCellBGColor = (row, col) => {
    const letter = rows[row][col];

    if (row >= curRow) {
      return colors.black;
    }
    if (letter === letters[col]) {
      return colors.primary;
    }
    if (letters.includes(letter)) {
      return colors.secondary;
    }
    return colors.darkgrey;
  };

  const getAllLettersWithColor = (color) => {
    return rows.flatMap((row, i) =>
      row.filter((cell, j) => getCellBGColor(i, j) === color)
    );
  };

  const greenCaps = getAllLettersWithColor(colors.primary);
  const yellowCaps = getAllLettersWithColor(colors.secondary);
  const greyCaps = getAllLettersWithColor(colors.darkgrey);

  const getCellStyle = (i, j) => [
    styles.cell,
    {
      borderColor: isCellActive(i, j) ? colors.grey : colors.darkgrey,
      backgroundColor: getCellBGColor(i, j),
    },
  ];

  if (!loaded) {
    return <ActivityIndicator />;
  }

  if (gameState !== "playing") {
    return (
      <EndScreen
        won={gameState === "won"}
        rows={rows}
        getCellBGColor={getCellBGColor}
      />
    );
  }

  return (
    <>
      <ScrollView style={styles.map}>
        {rows.map((row, i) => (
          <Animated.View
            entering={SlideInLeft.delay(i * 30)}
            key={`row-${i}`}
            style={styles.row}
          >
            {row.map((letter, j) => (
              <>
                {i < curRow && (
                  <Animated.View
                    entering={FlipInEasyY.delay(j * 100)}
                    key={`cell-color-${i}-${j}`}
                    style={getCellStyle(i, j)}
                  >
                    <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
                  </Animated.View>
                )}
                {i === curRow && !!letter && (
                  <Animated.View
                    entering={ZoomIn}
                    key={`cell-active-${i}-${j}`}
                    style={getCellStyle(i, j)}
                  >
                    <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
                  </Animated.View>
                )}
                {!letter && (
                  <View key={`cell-${i}-${j}`} style={getCellStyle(i, j)}>
                    <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
                  </View>
                )}
              </>
            ))}
          </Animated.View>
        ))}
      </ScrollView>

      <Keyboard
        onKeyPressed={onKeyPressed}
        greenCaps={greenCaps} // ['a', 'b']
        yellowCaps={yellowCaps}
        greyCaps={greyCaps}
      />
    </>
  );
};

export default Game;
