const { openFilePromise } = require("./filelibs.js");
const pdf = require("pdf-parse");
let fs = require("fs");

function splitWithTimeCode(sliced) {
  let pdfText = sliced;
  let timeLocations = [];
  let timeLocationsJustString = [];
  let timeLocationsJustNumbers = [];

  for (var i = 0; i < sliced.length; i++) {
    let char1 = sliced.charAt(i);
    let char2 = sliced.charAt(i + 1);
    let char3 = sliced.charAt(i + 2);
    let char4 = sliced.charAt(i + 3);
    let char5 = sliced.charAt(i + 4);
    let char6 = sliced.charAt(i + 5);
    let char7 = sliced.charAt(i + 6);
    let char8 = sliced.charAt(i + 7);

    if (
      Number(char1) != NaN &&
      Number(char2) != NaN &&
      char3 == ":" &&
      Number(char4) != NaN &&
      Number(char5) != NaN &&
      char6 == ":" &&
      Number(char7) != NaN &&
      Number(char8) != NaN
    ) {
      let charstring =
        char1 + char2 + char3 + char4 + char5 + char6 + char7 + char8;
      timeLocations.push({ location: i, charstring: charstring });
      timeLocationsJustString.push(charstring);
      timeLocationsJustNumbers.push(i);
    }
  }

  console.log(timeLocations);
  let inBetweenTimeCodes = [];
  timeLocations.forEach((element, i) => {
    // console.log(i)
    let first_char_pos = timeLocations[i].location;
    if (timeLocations[i + 1] != undefined) {
      let second_char_pos = timeLocations[i + 1].location;

      // console.log(first_char_pos)
      // console.log(second_char_pos)

      let new_string_from_timecode_char_positions = pdfText.slice(
        first_char_pos,
        second_char_pos
      );
      // console.log(timeLocations[i].charstring)

      let split_string = timeLocations[i].charstring + " ";

      new_string_from_timecode_char_positions_splits = new_string_from_timecode_char_positions.split(
        split_string
      );

      inBetweenTimeCodes.push(
        new_string_from_timecode_char_positions_splits[1]
      );

      // let removed_newlines = new_string_from_timecode_char_positions_splits[1].replace(/(\r\n|\n|\r)/gm,"");

      //inBetweenTimeCodes.push(removed_newlines)
      // inBetweenTimeCodes.push(new_string_from_timecode_char_positions_splits[1]);
    }
    // let new_split = pdfText.split(element)
    // inBetweenTimeCodes.push(new_split[0])
  });

  return inBetweenTimeCodes;
}

function removeBrackets(testString) {
  if (testString === "") {
    return "";
  }
  //console.log(testString)
  let without = "";
  let we_are_inside_brackets = false;
  for (var i = 0; i < testString.length; i++) {
    let char = testString.charAt(i);
    if (we_are_inside_brackets === false && char !== "[" && char !== "]") {
      without = without + char;
    }
    if (char === "[") {
      we_are_inside_brackets = true;
    }
    if (char === "]") {
      we_are_inside_brackets = false;
    }
  }

  let breakdown = without.split(" ");

  breakdown = breakdown.filter((element) => element !== "");

  without = breakdown.join(" ");

  return without;
}

const parsePdfThenMakeSentencesToBeTranslated = async (pdfPath) => {
  const rawdata = await openFilePromise(pdfPath);
  const pdfParsed = await pdf(rawdata);
  let pdfText = pdfParsed.text;

  let sliced = pdfText;

  let inBetweenTimeCodes = splitWithTimeCode(pdfText);

  fs.writeFile(
    "./results/inBetweenTimeCodes.json",
    JSON.stringify(inBetweenTimeCodes),
    function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("inBetweenTimeCodes.json was saved!");
    }
  );

  let masterParsed = [];

  let host_full_name_array = [];
  let guest_full_name_array = [];

  let host_full_name;
  let guest_full_name;

  inBetweenTimeCodes.forEach((element) => {
    let split_array = element.split(" ");

    // console.log("0 "+split_array[0]);

    // console.log("1 "+split_array[1]);
    // console.log("2 "+split_array[2]);

    if (element.includes("Music Transition")) {
      var split = element.split("Music Transition ");

      masterParsed.push({ type: "Music Transition", sentence: split[1] });
    } else if (element.includes("Sound \nEffect \nTransition")) {
      var split = element.split("Sound \nEffect \nTransition ");

      masterParsed.push({
        type: "Sound Effect Transition",
        sentence: split[1],
      });
    } else if (element.includes("Promo Promo")) {
      var split = element.split("Promo Promo ");

      masterParsed.push({ type: "Promo Promo", sentence: split[1] });
    } else {
      if (split_array[2] == "\nHost") {
        host_full_name_array.push(split_array[0]);
        host_full_name_array.push(split_array[1]);
        host_full_name = split_array[0] + " " + split_array[1];

        var split = element.split("\nHost ");
        var host_string = host_full_name + " Host";
        masterParsed.push({ type: host_string, sentence: split[1] });
        console.log("hello");
      }

      if (split_array[1] == "Host") {
        var split = element.split(split_array[0] + " Host ");
        var host_string = host_full_name + " Host";
        masterParsed.push({ type: host_string, sentence: split[1] });
        //console.log({type:host_string, sentence:split[1]});
      }

      if (split_array[2] == "\nGuest") {
        guest_full_name_array.push(split_array[0]);
        guest_full_name_array.push(split_array[1]);
        guest_full_name = split_array[0] + " " + split_array[1];

        var split = element.split("\nGuest ");

        var guest_string = guest_full_name + " Guest";

        masterParsed.push({ type: guest_string, sentence: split[1] });
      }

      if (split_array[1] == "Guest") {
        var split = element.split(split_array[0] + " Guest ");

        var guest_string = guest_full_name + " Guest ";

        masterParsed.push({ type: guest_string, sentence: split[1] });
      }

      if (split_array[1] == "Clip") {
        var split = element.split("Clip Clip ");

        var guest_string = guest_full_name + " Guest";

        masterParsed.push({ type: "Clip Clip", sentence: split[1] });
      }
    }
  });

  let sentences_to_be_translated = [];

  fs.writeFile("masterParsed.json", JSON.stringify(masterParsed), function (
    err
  ) {
    if (err) {
      return console.log(err);
    }
    console.log("masterParsed.json was saved!");
  });

  masterParsed.forEach((element) => {
    if (element.type.includes("Host") || element.type.includes("Guest")) {
      let removed_newlines = element.sentence.replace(/(\r\n|\n|\r)/gm, "");

      removed_newlines = removeBrackets(removed_newlines);
      sentences_to_be_translated.push(removed_newlines);
    }
  });

  fs.writeFile(
    "./results/sentences_to_be_translated.json",
    JSON.stringify(sentences_to_be_translated),
    function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("sentences_to_be_translated.json was saved!");
    }
  );

  console.log(sentences_to_be_translated[0]);
  console.log(sentences_to_be_translated[1]);

  let transcription = " ";
  sentences_to_be_translated.forEach((element) => {
    transcription = transcription + " " + element;
  });

  return sentences_to_be_translated;
};

const parsePdfThenMakeSentencesToBeTranslatedIncludingClips = async (
  pdfPath
) => {
  const rawdata = await openFilePromise(pdfPath);
  const pdfParsed = await pdf(rawdata);
  let pdfText = pdfParsed.text;

  let sliced = pdfText;

  let inBetweenTimeCodes = splitWithTimeCode(pdfText);

  fs.writeFile(
    "./results/inBetweenTimeCodes.json",
    JSON.stringify(inBetweenTimeCodes),
    function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("inBetweenTimeCodes.json was saved!");
    }
  );

  let masterParsed = [];

  let host_full_name_array = [];
  let guest_full_name_array = [];

  let host_full_name;
  let guest_full_name;

  inBetweenTimeCodes.forEach((element) => {
    let split_array = element.split(" ");

    // console.log("0 "+split_array[0]);

    // console.log("1 "+split_array[1]);
    // console.log("2 "+split_array[2]);

    if (element.includes("Music Transition")) {
      var split = element.split("Music Transition ");

      masterParsed.push({ type: "Music Transition", sentence: split[1] });
    } else if (element.includes("Sound \nEffect \nTransition")) {
      var split = element.split("Sound \nEffect \nTransition ");

      masterParsed.push({
        type: "Sound Effect Transition",
        sentence: split[1],
      });
    } else if (element.includes("Promo Promo")) {
      var split = element.split("Promo Promo ");

      masterParsed.push({ type: "Promo Promo", sentence: split[1] });
    } else {
      if (split_array[2] == "\nHost") {
        host_full_name_array.push(split_array[0]);
        host_full_name_array.push(split_array[1]);
        host_full_name = split_array[0] + " " + split_array[1];

        var split = element.split("\nHost ");
        var host_string = host_full_name + " Host";
        masterParsed.push({ type: host_string, sentence: split[1] });
        console.log("hello");
      }

      if (split_array[1] == "Host") {
        var split = element.split(split_array[0] + " Host ");
        var host_string = host_full_name + " Host";
        masterParsed.push({ type: host_string, sentence: split[1] });
        //console.log({type:host_string, sentence:split[1]});
      }

      if (split_array[2] == "\nGuest") {
        guest_full_name_array.push(split_array[0]);
        guest_full_name_array.push(split_array[1]);
        guest_full_name = split_array[0] + " " + split_array[1];

        var split = element.split("\nGuest ");

        var guest_string = guest_full_name + " Guest";

        masterParsed.push({ type: guest_string, sentence: split[1] });
      }

      if (split_array[1] == "Guest") {
        var split = element.split(split_array[0] + " Guest ");

        var guest_string = guest_full_name + " Guest ";

        masterParsed.push({ type: guest_string, sentence: split[1] });
      }

      if (split_array[1] == "Clip") {
        var split = element.split("Clip Clip ");

        var guest_string = guest_full_name + " Guest";

        masterParsed.push({ type: "Clip Clip", sentence: split[1] });
      }
    }
  });

  let sentences_to_be_translated = [];

  let hosts_guests_clip = [];
  fs.writeFile(
    "./results/masterParsed.json",
    JSON.stringify(masterParsed),
    function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("masterParsed.json was saved!");
    }
  );

  //// this is where we add back in Clips
  masterParsed.forEach((element, i) => {
    if (
      element.type.includes("Host") ||
      element.type.includes("Guest") ||
      element.type.includes("Clip Clip")
    ) {
      console.log(i);

      if (element.sentence !== undefined) {
        let removed_newlines = element.sentence.replace(/(\r\n|\n|\r)/gm, "");

        removed_newlines = removeBrackets(removed_newlines);
        sentences_to_be_translated.push(removed_newlines);
        hosts_guests_clip.push({
          type: element.type,
          sentence: removed_newlines,
        });
      }
    }
  });

  fs.writeFile(
    "./results/sentences_to_be_translated.json",
    JSON.stringify(sentences_to_be_translated),
    function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("sentences_to_be_translated.json was saved!");
    }
  );

  console.log(sentences_to_be_translated[0]);
  console.log(sentences_to_be_translated[1]);

  let transcription = " ";
  sentences_to_be_translated.forEach((element) => {
    transcription = transcription + " " + element;
  });

  let transcription_filename = "./results/transcription_bullseye.json";

  fs.writeFile(transcription_filename, JSON.stringify(transcription), function (
    err
  ) {
    if (err) {
      return console.log(err);
    }
    console.log("transcription.json was saved!");
  });

  return {
    sentences_to_be_translated: sentences_to_be_translated,
    transcription: transcription,
    master_parsed: masterParsed,
    hosts_guests_clip: hosts_guests_clip,
    transcription_filename: transcription_filename,
  };
};

module.exports = {
  parsePdfThenMakeSentencesToBeTranslated,
  parsePdfThenMakeSentencesToBeTranslatedIncludingClips,
};
