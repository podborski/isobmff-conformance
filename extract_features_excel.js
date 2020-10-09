/**
 * This script is using the ff-conformance.csv and feature_doc.csv files which are created using Save As (CSV) in MS excel from ff-conformance.xls.
 * It iterates over all files in the conformance suite and tries to extract all features for each file found in ff-conformance.xls
 * It also extracts all features from ff-conformance.csv and tries to find the corresponding descriptions in feature_doc.csv and creates the final database file features.json
 */

const parse = require('csv-parse');
const fs = require('fs');
const path = require('path');
const walk = require('walk');

const EXCEL_CSV_FILE = './data/ff-conformance.csv';
const EXCEL_CSV_FEATURES = './data/feature_doc.csv';

const INCLUDE_FILTERS = ['.uvu', 'uvvu', '.mp4', '.3gs', '.iso3', '3gp'];

const CONFORMANCE_ROOT_DIR = './ISOBMFF-Conformance';
const OUT_DIR = './data';

let excel_data = null;
let excel_features = null;
let file_cnt = 0;
let excluded_cnt = 0;

function checkExtension(filter_array, filename) {
  return filter_array.some(function(ext){
    return filename.endsWith(ext);
  });
}

function getFeatureDescription(feature) {
  if(excel_features != null) {
    for(let i=0; i<excel_features.length; i++){
      if(excel_features[i][0].toLowerCase() == feature.toLowerCase()) return excel_features[i][1];
    }
  }
  return '';
}

function isValidFeature(line) {
  for(let i=2; i<line.length; i++){
    if(line[i].toLowerCase() == 'x') return true;
  }
  let filter = ['', 'Part 12', 'Movies', 'movie fragments', 'Meta-boxes', 'File delivery extensions'];
  for(let i=0; i<filter.length; i++) {
    if(filter[i].toLowerCase() == line[0].toLowerCase()) return false;
  }
  return true;
}

function getFileFeaturesByIdx(idx) {
  let feature_list = [];
  for(let i=6; i<excel_data.length; i++) {
    if(excel_data[i][idx].toLowerCase() == 'x') feature_list.push(excel_data[i][0]);
  }
  return {
    company: excel_data[0][idx],
    concept: excel_data[1][idx],
    features: feature_list
  }
}

function getFileTableIdx(filename) {
  let filenamesTable = 
  [
    [''],
    [''],
    ['male_amr122.3gp'],
    ['male_amr122DTX.3gp'],
    ['female_amr67_hinted.3gp'],
    ['female_amr67DTX_hinted.3gp'],
    ['a1-foreman-QCIF.mp4'],
    ['a2-foreman-QCIF-hinted.mp4'],
    ['a3-tone-protected.mp4', 'a3b-tone-deprot.mp4'],
    ['a4-tone-fragmented.mp4'],
    ['a5-foreman-AVC.mp4'],
    ['a6_tone_multifile.mp4'],
    ['a7-tone-oddities.mp4'],
    ['a8-foreman_QCIF_edit.mp4'],
    ['a9-aac-samplegroups-edit.mp4'],
    ['a10-foreman_QCIF-raw.mp4'],
    [''],
    ['f2.mp4'],
    ['f1.mp4'],
    ['01_simple.mp4'],
    ['02_dref_edts_img.mp4'],
    ['03_hinted.mp4'],
    ['04_bifs_video.mp4'],
    ['05_bifs_video_protected_v2.mp4'],
    ['06_bifs.mp4'],
    ['07_bifs_sprite.mp4'],
    ['08_bifs_carousel_v2.mp4'],
    ['09_text.mp4'],
    ['10_fragments.mp4'],
    ['12_metas_v2.mp4'],
    ['13_long.mp4'],
    ['14_large.mp4'],
    ['timed-metadata.mp4'],
    ['compact-no-code-fec-1.iso3'],
    ['compact-no-code-fec-2.iso3'],
    ['mbms-fec.iso3'],
    ['fragment-random-access-1+AF8-rev1.mp4'],
    ['fragment_random_access-2.mp4'],
    ['pdin_example.3gp'],
    ['rs_example_r1.3gp'],
    ['sg-tl-st.mp4'],
    ['restricted.mp4'],
    ['trgr_hvc1.mp4'],
    ['alst_hvc1.mp4'],
    ['subs_tile_hvc1.mp4'],
    ['subs_slice_hvc1.mp4'],
    ['rtp_rtcp_reception_hint_tracks_v2.mp4'],
    ['hvc2_extractors.mp4'],
    ['shvc_hvc1_hvc2_multiple_tracks_extractors.mp4', 'shvc_hev1_hev2_multiple_tracks_extractors.mp4', 'shvc_hev1_single_track.mp4', 'shvc_hvc1_single_track.mp4', 'shvc_hvc2_single_track.mp4', 'shvc_hev2_single_track.mp4', 'shvc_hvc1_lhv1_multiple_tracks_implicit.mp4', 'shvc_hev1_lhe1_multiple_tracks_implicit.mp4', 'mhvc_hvc1_lhv1_multiple_tracks_implicit.mp4', 'mhvc_hvc1_hvc2_multiple_tracks_extractors.mp4', 'mhvc_hev1_hev2_multiple_tracks_extractors.mp4', 'mhvc_hev1_lhe1_multiple_tracks_implicit.mp4', 'mhvc_hvc2_single_track.mp4', 'mhvc_hev2_single_track.mp4', 'mhvc_hev1_single_track.mp4', 'mhvc_hvc1_single_track.mp4'],
    ['hevc_tiles_multiple_tracks.mp4', 'hevc_tiles_multiple_tracks_empty_base.mp4', 'hevc_tiles_single_track_nalm.mp4', 'hevc_tiles_single_track_trif_full_picture.mp4', 'hevc_tiles_single_track_nalm_rle.mp4', 'hevc_tiles_single_track_nalm_all_intra.mp4']
  ]
  
  for(let i=2; i<filenamesTable.length; i++) {
    for(let j=0; j<filenamesTable[i].length; j++) {
      if(filename == filenamesTable[i][j]) return i;
    }
  }
  return -1;
}

function extractFeatures() {
  // get all features with possible descriptions and write them into 'feature_infos.json' file
  let features = {};
  for(let i=6; i<excel_data.length; i++){
    if(isValidFeature(excel_data[i])) {
      let description = getFeatureDescription(excel_data[i][0]);
      features[excel_data[i][0]] = description;
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, 'features.json'), JSON.stringify(features, null, 2));

  // iterate over all conformance files and create the corresponding feature json file for each found in ff-conformance.xls
  let walker = walk.walk(CONFORMANCE_ROOT_DIR).on('file', function(base, stats, next){  
    if( checkExtension(INCLUDE_FILTERS, stats.name) ) {
      file_cnt++;
      let file_path = path.join(base, stats.name);
      let idx = getFileTableIdx(stats.name);
      if(idx>=0) {
        let file_features = getFileFeaturesByIdx(idx);
        let file_feature_base = path.join(OUT_DIR, 'file_features', base.replace(CONFORMANCE_ROOT_DIR, ''));
        let file_feature_path = path.join(file_feature_base, stats.name + '_excel.json');
        fs.mkdirSync(file_feature_base, { recursive: true });
        fs.writeFileSync(file_feature_path, JSON.stringify(file_features, null, 2));
      }
      else {
        excluded_cnt++;
        console.log('Not in ff-conformance.xls: ' + file_path);
      }
    }
    next();
  });

  walker.on('end', function(){
    console.log('Number of files in conformance suite: ' + file_cnt);
    console.log('Number of files not found in xls: ' + excluded_cnt);
  });
}

// Create the parsers
const parser1 = parse({delimiter: ';'}, function(err, data) {
  excel_data = data;
  if(excel_features != null) extractFeatures();
});
const parser2 = parse({delimiter: ';'}, function(err, data) {
  excel_features = data;
  if(excel_data != null) extractFeatures();
});
// parse both csv files
fs.createReadStream(EXCEL_CSV_FILE).pipe(parser1);
fs.createReadStream(EXCEL_CSV_FEATURES).pipe(parser2);
