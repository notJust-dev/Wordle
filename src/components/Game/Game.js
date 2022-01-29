import { useEffect, useState } from "react";
import { Text, View, ScrollView, Alert, ActivityIndicator } from "react-native";
import {
  colors,
  CLEAR,
  ENTER,
  colorsToEmoji,
  NUMBER_OF_TRIES,
} from "../../constants";
import Keyboard from "../Keyboard";
import * as Clipboard from "expo-clipboard";
import styles from "./Game.styles";
import { copyArray, getDayOfTheYear } from "../../utils";
import { getWordOfTheDay } from "../../services/words";
import AsyncStorage from "@react-native-async-storage/async-storage";

const dayOfTheYear = getDayOfTheYear();

const Game = () => {
  const word = getWordOfTheDay();
  const letters = word.split(""); // ['h', 'e', 'l', 'l', 'o']

  const [rows, setRows] = useState(
    new Array(NUMBER_OF_TRIES).fill(new Array(letters.length).fill(""))
  );
  const [curRow, setCurRow] = useState(0);
  const [curCol, setCurCol] = useState(0);
  const [gameState, setGameState] = useState("playing"); // won, lost, playing
  const [numberTries, setNumberTries] = useState(0);
  const [loaded, setLoaded] = useState(false);
  // const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (curRow > 0) {
      checkGameState();
    }
  }, [curRow]);

  const getDayKey = () => `day_${getDayOfTheYear()}`;

  const getGameCache = async () => {
    try {
      const gameCacheString = await AsyncStorage.getItem("@game_cache");
      return JSON.parse(gameCacheString) || { days: {} };
    } catch (e) {
      console.log(e);
      return { days: {} };
    }
  };

  useEffect(() => {
    const readGameCache = async () => {
      const gameCache = await getGameCache();

      if (gameCache?.days?.[getDayKey()]) {
        const { rows, curCol, curRow, gameState, numberTries } =
          gameCache.days[getDayKey()];
        setRows(rows);
        setCurCol(curCol);
        setCurRow(curRow);
        setGameState(gameState);
        setNumberTries(numberTries);
      }
      setLoaded(true);
      console.log("Finished loading!");
    };
    readGameCache();
  }, []);

  useEffect(() => {
    const saveGameCache = async () => {
      if (!loaded) {
        return;
      }
      const gameData = {
        rows,
        curCol,
        curRow,
        gameState,
        numberTries,
      };

      const gameCache = await getGameCache();

      gameCache.days[getDayKey()] = gameData;

      try {
        const gameCacheString = JSON.stringify(gameCache);
        await AsyncStorage.setItem("@game_cache", gameCacheString);
      } catch (e) {
        console.log(e);
      }
    };
    saveGameCache();
  }, [rows, curRow, curCol, gameState]);

  const checkGameState = () => {
    if (checkIfWon() && gameState !== "won") {
      Alert.alert("Huraaay", "You won!", [
        { text: "Share", onPress: shareScore },
      ]);
      setGameState("won");
      setNumberTries(curCol - 1);
    } else if (checkIfLost() && gameState !== "lost") {
      Alert.alert("Meh", "Try again tomorrow!");
      setGameState("lost");
    }
  };

  const shareScore = () => {
    const shareRows = rows
      .map((row, i) =>
        row.map((cell, j) => colorsToEmoji[getCellBGColor(i, j)]).join("")
      )
      .filter((row) => row);

    const textMap = shareRows.join("\n");
    const textToShare = `Progle ${dayOfTheYear} ${shareRows.length}/${NUMBER_OF_TRIES} \n${textMap}\n\n #Progle: Get in on  and ▶️ `;
    Clipboard.setString(textToShare);
    Alert.alert("Copied successfully", "Share your score on you social media");
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

  if (!loaded) {
    console.log("Loading...");
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.map}>
        {rows.map((row, i) => (
          <View key={`row-${i}`} style={styles.row}>
            {row.map((letter, j) => (
              <View
                key={`cell-${i}-${j}`}
                style={[
                  styles.cell,
                  {
                    borderColor: isCellActive(i, j)
                      ? colors.grey
                      : colors.darkgrey,
                    backgroundColor: getCellBGColor(i, j),
                  },
                ]}
              >
                <Text style={styles.cellText}>{letter.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <Text style={styles.creditH1}>
        Made with 💛 by developers for developers
      </Text>
      <Text style={styles.creditH2}>www.notjust.dev</Text>

      <Keyboard
        onKeyPressed={onKeyPressed}
        greenCaps={greenCaps} // ['a', 'b']
        yellowCaps={yellowCaps}
        greyCaps={greyCaps}
      />
    </View>
  );
};

export default Game;
