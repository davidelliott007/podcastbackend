const { openFilePromise } = require("./filelibs.js");
const pdf = require("pdf-parse");
let fs = require("fs");

function doFUllSearchForAllWithinBounds(
  trans_data_JSON,
  align_JSON,
  bounds_start,
  bounds_end
) {
  let sentences_still_unaccounted_for = trans_data_JSON;

  let remaining_with_top_fuzzy_matches = [];
  let even_with_full_search_nothing_doing = [];
  let corrected_sentence;

  // let's make a corrected_sentences array

  let corrected_sentences_array = [];
  let corrected_sentences_array_sentence_occurs_in_trans_more_than_once = [];

  let counter = bounds_start;

  sentences_still_unaccounted_for.forEach((sent_element, i) => {
    let sentence = sent_element.enlgish_sentence;
    let words = sentence.split(" ");

    words = words.filter((element) => element !== "");

    let new_words = [];
    words.forEach((we) => {
      let split_for_dashes = we.split("—");
      new_words = new_words.concat(split_for_dashes);
    });

    words = new_words;

    corrected_sentence = words.join(" ");

    let punctuationless = corrected_sentence.replace(
      /[.,\/#!$%\^&\*;:{}=\-—_`~()]/g,
      ""
    );
    corrected_sentence = punctuationless.replace(/\s{2,}/g, " ");

    if (corrected_sentences_array.includes(corrected_sentence)) {
      corrected_sentences_array_sentence_occurs_in_trans_more_than_once.push(
        corrected_sentence
      );
    }

    corrected_sentences_array.push(corrected_sentence);
  });

  sent_loop: for (ii = 0; ii < sentences_still_unaccounted_for.length; ii++) {
    console.log(ii);
    sent_element = sentences_still_unaccounted_for[ii];

    if (counter > bounds_end) {
      break sent_loop;
    }

    let sentence = sent_element.enlgish_sentence;

    let punctuationless1 = sentence.replace(
      /[.,\/#!$%\^&\*;:{}=\-—_`~()]/g,
      " "
    );
    sentence = punctuationless1.replace(/\s{2,}/g, " ");

    let words = sentence.split(" ");

    if (words.includes("kingpin")) {
      console.log("pause");
    }

    words = words.filter((element) => element !== "");

    let new_words = [];
    words.forEach((we) => {
      let split_for_dashes = we.split("—");
      new_words = new_words.concat(split_for_dashes);
    });

    words = new_words;
    corrected_sentence = words.join(" ");
    let fuzzy_matches = [];
    if (words.includes("kingpin")) {
      console.log("pause");
    }

    let corrected_sentence_set = FuzzySet();
    corrected_sentence_set.add(corrected_sentence);

    // let i = 0;
    let skip_the_rest = false;
    if (words.includes("kingpin")) {
      console.log("pause");
    }
    align_JSON.words.forEach((element, i) => {
      // console.log(i);
      let end_of_sent = i + words.length;

      let sliced = align_JSON.words.slice(i, end_of_sent);
      let sliced_string = "";
      sliced.forEach((se, i) => {
        if (i === sliced.length - 1) {
          sliced_string = sliced_string + se.word;
        } else {
          sliced_string = sliced_string + se.word + " ";
        }
      });

      // if (words.includes("little") && sliced_string.split(" ")[0] === "Talk") {
      //   console.log("pause");
      // }

      // if (words.includes("family") && sliced_string.split(" ")[0] === "He") {
      //   console.log("pause");
      // }

      let punctuationlesssliced = sliced_string.replace(
        /[.,\/#!$%\^&\*;:{}=\-_`~()]/g,
        ""
      );
      sliced_string = punctuationlesssliced.replace(/\s{2,}/g, " ");

      if (
        corrected_sentence === sliced_string &&
        corrected_sentences_array_sentence_occurs_in_trans_more_than_once.includes(
          corrected_sentences_array
        ) === false
      ) {
        let not_founds = sliced.filter((e) => e.case === "not-found-in-audio");

        if (not_founds.length > 0) {
          console.log("not_founds.length");

          if (not_founds.includes(sliced[sliced.length - 1])) {
            let prev_aligned_word = align_JSON.words[end_of_sent - 2];
            let next_aligned_word = align_JSON.words[end_of_sent];

            let prev_aligned_word_end = prev_aligned_word.end;

            let next_aligned_word_start = next_aligned_word.start;

            let last_sliced = sliced[sliced.length - 1];

            let corrected_aligned_word = {
              alignedWord: last_sliced.word,
              case: "corrected-in-node",
              start: prev_aligned_word_end + 0.01,
              end: next_aligned_word_start - 0.02,
              endOffset: last_sliced.endOffset,
              phones: [],
              startOffset: last_sliced.startOffset,
              word: last_sliced.word,
            };

            console.log("not_founds last one is present");

            sliced[sliced.length - 1] = corrected_aligned_word;

            console.log("not_founds last one is present");

            //fuck, this actually works!
          }
        }

        fuzzy_matches.push({
          alignJSON_words_iter: i,
          alignJSON_words: element,
          fuzzy_match: 999.99,
          sliced_string: sliced_string,
          align_array: sliced,
          corrected_set_sentence: corrected_sentence,
        });

        skip_the_rest = true;
      } else if (skip_the_rest === false) {
        let fuzzy_match = corrected_sentence_set.get(sliced_string);
        // console.log(fuzzy_match);
        if (fuzzy_match !== null) {
          if (fuzzy_match[0][0] > 0.65) {
            let not_founds = sliced.filter(
              (e) => e.case === "not-found-in-audio"
            );

            if (not_founds.length > 0) {
              if (not_founds.includes(sliced[sliced.length - 1])) {
                let prev_aligned_word = align_JSON.words[end_of_sent - 2];
                let next_aligned_word = align_JSON.words[end_of_sent];

                let prev_aligned_word_end = prev_aligned_word.end;

                let next_aligned_word_start = next_aligned_word.start;

                let last_sliced = sliced[sliced.length - 1];

                let corrected_aligned_word = {
                  alignedWord: last_sliced.word,
                  case: "corrected-in-node",
                  start: prev_aligned_word_end + 0.01,
                  end: next_aligned_word_start - 0.02,
                  endOffset: last_sliced.endOffset,
                  phones: [],
                  startOffset: last_sliced.startOffset,
                  word: last_sliced.word,
                };
                if (not_founds.length > 0 && words.includes("sentence")) {
                  console.log("not_founds.length");
                }

                sliced[sliced.length - 1] = corrected_aligned_word;

                console.log("not_founds last one is present");

                //fuck, this actually works!
              }
            }

            fuzzy_matches.push({
              alignJSON_words_iter: i,
              alignJSON_words: element,
              fuzzy_match: fuzzy_match[0][0],
              sliced_string: sliced_string,
              align_array: sliced,
              corrected_set_sentence: corrected_sentence,
            });
          }
        }
      }
      // i = i + 1;
    });

    let sorted_fuzzy_matches = fuzzy_matches.sort(
      (a, b) => a.fuzzy_match[0] - b.fuzzy_match[0]
    );

    sorted_fuzzy_matches = sorted_fuzzy_matches.reverse();

    if (words.includes("Gus") && words.includes("restaurant")) {
      console.log("pause");
    }

    remaining_with_top_fuzzy_matches.push({
      trans_data_JSON_counter: ii,
      sent_element: sent_element,
      fuzzy_matches: sorted_fuzzy_matches,
    });
    if (
      corrected_sentence ===
      "He’s appeared in dozens of other movies and TV shows"
    ) {
      console.log("pause");
    }

    if (fuzzy_matches.length === 0) {
      even_with_full_search_nothing_doing.push(sent_element);
    }
    console.timeStamp;
    // console.log(console.timeStamp);
    console.log("fuzzzy matching done " + sent_element.enlgish_sentence);

    counter = counter + 1;
  }

  // finals_bullseye_simple_output.forEach(element =>
  //   {
  //     if element.trans_data_JSON
  //   });
  if (bounds_end < trans_data_JSON.count) {
    fs.writeFile(
      "./results/remaining_with_top_fuzzy_matches" +
        bounds_start +
        "-" +
        bounds_start +
        " .json",
      JSON.stringify(remaining_with_top_fuzzy_matches),
      function (err) {
        if (err) {
          return console.log(err);
        }
        console.log(
          "./results/remaining_with_top_fuzzy_matches.json was saved!"
        );
      }
    );
  } else {
    fs.writeFile(
      "./results/remaining_with_top_fuzzy_matches.json",
      JSON.stringify(remaining_with_top_fuzzy_matches),
      function (err) {
        if (err) {
          return console.log(err);
        }
        console.log(
          "./results/remaining_with_top_fuzzy_matches.json was saved!"
        );
      }
    );
  }

  return {
    remaining_with_top_fuzzy_matches: remaining_with_top_fuzzy_matches,
    even_with_full_search_nothing_doing: even_with_full_search_nothing_doing,
    corrected_sentences_array: corrected_sentences_array,
  };
}

module.exports = {
  doFUllSearchForAllWithinBounds,
};
