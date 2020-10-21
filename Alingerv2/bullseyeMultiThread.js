let fs = require("fs");
const { connect } = require("http2");
const { cpuUsage } = require("process");

const { fuzzySet } = require("./fuzzyset.js");

const { curly } = require("node-libcurl");
const { Curl } = require("node-libcurl");

let align;
let missing_words;

const { openFilePromise } = require("./filelibs.js");

const { doFUllSearchForAllWithinBounds } = require("./bullseyelib.js");

const {
  parsePdfThenMakeSentencesToBeTranslated,
  parsePdfThenMakeSentencesToBeTranslatedIncludingClips,
} = require("./pdfParsing.js");
const { compileFunction } = require("vm");

let audacity_labels_export_unknowns_array = [];

let sortDescending = function (a, b) {
  if (a.timing.start < b.timing.start) {
    return -1;
  } else if (a.timing.start > b.timing.start) {
    return 1;
  } else {
    return 0;
  }
};

async function gentleAlign(MP3File, textForAligner) {
  const curl = new Curl();
  const close = curl.close.bind(curl);

  console.log("starting gentle align");
  curl.setOpt(
    Curl.option.URL,
    "http://localhost:8765/transcriptions?async=false"
  );
  // curl.setOpt(Curl.option.HTTPPOST, [
  //   { name: "audio", file: "./ep375-purechimp_tc.mp3", type: "audio/mpeg" },
  //   {
  //     name: "transcript",
  //     file: "./Pure_Chimp_Transcript.txt",
  //     type: "text/plain",
  //   },
  // ]);

  curl.setOpt(Curl.option.HTTPPOST, [
    { name: "audio", file: MP3File, type: "audio/mpeg" },
    {
      name: "transcript",
      file: textForAligner,
      type: "text/plain",
    },
  ]);

  curl.on("end", function (statusCode, data, headers) {
    console.info(statusCode);
    console.info("---");

    fs.writeFile("alinger_data.json", data, function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("alinger_data.json " + " was saved!");
    });

    console.info("---");
  });
  curl.on("error", function () {
    console.log("error");
    console.log(curl);
  });
  curl.perform();
}

const makeTheTranscript = async (PDFToBeTranscripted) => {
  const bullseye_sentences_to_be_translated = await parsePdfThenMakeSentencesToBeTranslatedIncludingClips(
    PDFToBeTranscripted
  );

  const gentle_resulls = await gentleAlign(
    "../Oct 21/20201013_bullseye_bullseye20201013-richard_jenkins.mp3_10c286183260e081a5a5d7c573213b48_26188872.mp3",
    bullseye_sentences_to_be_translated.transcription_filename
  );

  console.log(gentle_resulls);
};

function makeReferenceRemainingWithTopJSONDoc(threaded_results) {
  let limited_info_top_fuzzy_matches = threaded_results.remaining_with_top_fuzzy_matches.map(
    (e) => {
      let better_fuzzy_matches = [];
      e.fuzzy_matches.forEach((fm) => {
        let limited_align_array = [];

        let phones_removed = fm.align_array.map((pr) => {
          pr.phones = [];
          return pr;
        });

        fm.align_array = phones_removed;
        console.log("fm");
        if (fm.align_array.length > 3) {
          limited_align_array.push(fm.align_array[0]);
          limited_align_array.push(fm.align_array[fm.align_array.length - 2]);
          limited_align_array.push(fm.align_array[fm.align_array.length - 1]);
        } else {
          limited_align_array = fm.align_array;
        }

        let improved_fm = fm;
        improved_fm.align_array = limited_align_array;
        better_fuzzy_matches.push(improved_fm);
      });
      e.fuzzy_matches = better_fuzzy_matches;
      return e;
    }
  );

  fs.writeFile(
    "./results/limited_info_top_fuzzy_matches.json",
    JSON.stringify(limited_info_top_fuzzy_matches),
    function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("./results/limited_info_top_fuzzy_matches.json!");
    }
  );
}

const alignJSONIndivThreadPromise = (
  threader_config,
  align_JSON,
  bullseye_sentences_to_be_translated,
  trans_data_JSON
) => {
  myPromise = new Promise((resolve, reject) => {
    console.log("align started");
    console.log({ threader_config });

    let threaded_results = doFUllSearchForAllWithinBounds(
      trans_data_JSON,
      align_JSON,
      threader_config.range_start,
      threader_config.range_end
    );

    let file_name = "threaded_results" + threader_config.fileNumber + ".json";

    makeReferenceRemainingWithTopJSONDoc(threaded_results);

    fs.writeFile(file_name, JSON.stringify(threaded_results), function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("threaded_results.json was saved!");
    });

    resolve(threaded_results);
  });

  return myPromise;
};

function turnResutIntoiPhoneArray(
  results,
  trans_data_JSON,
  bullseye_sentences_parsePdfThenMakeSentencesToBeTranslatedIncludingClips
) {
  let ending_in_case_not = [];
  let remaining_with_top_fuzzy_matches =
    results.remaining_with_top_fuzzy_matches;
  let corrected_sentences_array = results.corrected_sentences_array;
  // const remaining_with_top_fuzzy_matches_data = await openFilePromise('remaining_with_top_fuzzy_matches.json');
  // let remaining_with_top_fuzzy_matches = JSON.parse(remaining_with_top_fuzzy_matches_data);

  let one =
    bullseye_sentences_parsePdfThenMakeSentencesToBeTranslatedIncludingClips.master_parsed;

  console.log(one);
  console.log("all done");

  let filtered_trans = trans_data_JSON.filter((element) => {
    if (element.enlgish_sentence.match(/[a-z]/i)) {
      return true;
    }
    return false;
  });

  let foriPhoneApp = [];
  let aligned_done = [];
  let iphoneAlign_iters = [];

  //fffrom here

  filtered_trans.forEach((td, i) => {
    let from_remaining = remaining_with_top_fuzzy_matches.find(
      (fr) => fr.sent_element.enlgish_sentence === td.enlgish_sentence
    );

    let all_matching = remaining_with_top_fuzzy_matches.filter(
      (fr) => fr.sent_element.enlgish_sentence === td.enlgish_sentence
    );

    if (from_remaining === undefined) {
      return;
    }

    console.log(td.enlgish_sentence);

    let breakdown = td.enlgish_sentence.split(" ");
    console.log(breakdown);
    if (breakdown.includes("dozens")) {
      console.log(td.enlgish_sentence);
    }

    //        remaining_with_top_fuzzy_matches[0].fuzzy_matches[0].alignJSON_words

    //let's order them by aligndistance

    let last_align = iphoneAlign_iters[iphoneAlign_iters.length - 1];

    let mapped_by_closest_to_last_align = from_remaining.fuzzy_matches.map(
      (e) => {
        if (last_align === undefined) {
          return {
            fuzzy_match: e,
            diff_alignJSON_words_iter: e.alignJSON_words_iter,
          };
        } else {
          let diff = e.alignJSON_words_iter - last_align;
          if (diff < 0) {
            diff = diff * -1;
          }
          return { fuzzy_match: e, diff_alignJSON_words_iter: diff };
        }
      }
    );

    let word_count_last_iPhone_app_element = 0;
    let word_count_this_element = td.enlgish_sentence.split(" ").length;

    if (foriPhoneApp.length > 0) {
      word_count_last_iPhone_app_element = foriPhoneApp[
        foriPhoneApp.length - 1
      ].sentence_from_transcript.split(" ").length;
    }

    let count_of_this_and_last_sentence =
      word_count_this_element + word_count_last_iPhone_app_element;

    // ok here is the question - what is a "Reasonable amount" in the context of a sentence that just happened after a clip?
    // we need to find out if the prior sentence was a clip, then add that to the count of the last sentence.

    // first, answer the question - in bullseye_sentences_parsePdfThenMakeSentencesToBeTranslatedIncludingClips.hosts_guests_clip, does the current sentence occur right after a clip?

    let corrected_words = td.enlgish_sentence.split(" ");

    corrected_words = corrected_words.filter((element) => element !== "");

    let corrected_sentence_local = corrected_words.join(" ");

    let index_of_current = bullseye_sentences_parsePdfThenMakeSentencesToBeTranslatedIncludingClips.hosts_guests_clip.findIndex(
      (e) => e.sentence.includes(corrected_sentence_local)
    );

    if (index_of_current > 1) {
      let previous_element =
        bullseye_sentences_parsePdfThenMakeSentencesToBeTranslatedIncludingClips
          .hosts_guests_clip[index_of_current - 1];

      if (previous_element.type.includes("Clip")) {
        let count_of_clip_words = previous_element.sentence.split(" ").length;
        count_of_this_and_last_sentence =
          word_count_this_element +
          count_of_clip_words +
          word_count_last_iPhone_app_element;
      }

      console.log("hello");
    }

    let mapped_by_closest_to_last_align_within_reasonable_count = mapped_by_closest_to_last_align.filter(
      (e) => e.diff_alignJSON_words_iter < count_of_this_and_last_sentence
    );

    let sorted_mapped_by_closest_to_last_align_within_reasonable_count = mapped_by_closest_to_last_align_within_reasonable_count.sort(
      (a, b) => a.diff_alignJSON_words_iter - b.diff_alignJSON_words_iter
    );

    // let with_fat_scores = [];
    // sorted_mapped_by_closest_to_last_align_within_reasonable_count.forEach( e =>
    //   {
    //     let score = e.
    //   }

    //   let score =
    // });

    let mapped100s = sorted_mapped_by_closest_to_last_align_within_reasonable_count.map(
      (e) => {
        let new_obj = e;
        var intvalue = Math.round(new_obj.fuzzy_match.fuzzy_match * 100.0);

        new_obj.fuzzy_match.fuzzy_match = intvalue;
        return new_obj;
      }
    );

    function compare(a, b) {
      // Use toUpperCase() to ignore character casing
      const scoreA = a.fuzzy_match.fuzzy_match;
      const scoreB = b.fuzzy_match.fuzzy_match;

      let comparison = 0;
      if (scoreA > scoreB) {
        comparison = -1;
      } else if (scoreA < scoreB) {
        comparison = 1;
      }
      return comparison;
    }

    let resorted = mapped100s.sort(compare);

    if (resorted.length > 0) {
      let final_choses_fuzzy_match = resorted[0].fuzzy_match;

      let align_array_length = final_choses_fuzzy_match.align_array.length;
      let start = final_choses_fuzzy_match.align_array[0].start;
      let end =
        final_choses_fuzzy_match.align_array[align_array_length - 1].end;

      let timing_sentence = final_choses_fuzzy_match.sliced_string;
      let sentence_from_transcript =
        from_remaining.sent_element.enlgish_sentence + ".";
      let translation_sentence =
        from_remaining.sent_element.translated_sentence[0].translation;

      iphoneAlign_iters.push(final_choses_fuzzy_match.alignJSON_words_iter);

      if (
        final_choses_fuzzy_match.align_array[
          final_choses_fuzzy_match.align_array.length - 1
        ].case !== "success"
      ) {
        ending_in_case_not.push({
          timing: { start: start, end: end, sentence: timing_sentence },
          sentence_from_transcript: sentence_from_transcript,
          translation: translation_sentence,
        });
      }
      foriPhoneApp.push({
        timing: { start: start, end: end, sentence: timing_sentence },
        sentence_from_transcript: sentence_from_transcript,
        translation: translation_sentence,
      });
    }
  });

  foriPhoneApp = foriPhoneApp.sort((a, b) => {
    a.timing.start - b.timing_start;
  });

  let foriPhoneAppArray = { array: foriPhoneApp };

  fs.writeFile(
    "./results/ending_in_case_not.json",
    JSON.stringify(ending_in_case_not),
    function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("ending_in_case_not.json was saved!");
    }
  );

  return foriPhoneAppArray;
}

async function ParallelAligns() {
  const data = await openFilePromise("alignalignbullseye0072.json");
  let align_JSON = JSON.parse(data);

  const bullseye_sentences_parsePdfThenMakeSentencesToBeTranslatedIncludingClips = await parsePdfThenMakeSentencesToBeTranslatedIncludingClips(
    "./Bullseye-Ep.-6.16.20_Final-Draft.pdf"
  );

  const translations_data = await openFilePromise(
    "sentences_and_translations_bullseye.json"
  );

  //put the aling json data array into ending in case

  let trans_data_JSON = JSON.parse(translations_data);

  let threaded_results = await alignJSONIndivThreadPromise(
    { fileNumber: 0, range_start: 0, range_end: 99999999 },
    align_JSON,
    bullseye_sentences_parsePdfThenMakeSentencesToBeTranslatedIncludingClips,
    trans_data_JSON
  );

  // var contains_unks =

  // const data_threaded = await openFilePromise("threaded_results0.json");

  // let threaded_results = JSON.parse(data_threaded);

  let foriPhoneAppArray = turnResutIntoiPhoneArray(
    threaded_results,
    trans_data_JSON,
    bullseye_sentences_parsePdfThenMakeSentencesToBeTranslatedIncludingClips
  );

  fs.writeFile(
    "./results/foriPhoneAppArrayFullSearch.json",
    JSON.stringify(foriPhoneAppArray),
    function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("foriPhoneAppArrayFullSearch.json was saved!");
    }
  );

  // let result2 = alignJSONIndivThreadPromise({ fileNumber: 1, range_start: 100, range_end: 200 }, align_JSON, bullseye_sentences_to_be_translated, trans_data_JSON);
}

//ParallelAligns();

makeTheTranscript("Bullseye-Ep.-10.13.20_Final-Draft.pdf");
//littleExperimentalChain2()
