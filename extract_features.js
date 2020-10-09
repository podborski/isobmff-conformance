const fs = require('fs');
const path = require('path');
var MP4Box = require('./lib/mp4box.all.js');
// const { type } = require('os');

const walk = require('walk');

// const INCLUDE_FILTERS = ['.mp4', '.3gp', '.3gs'];
const INCLUDE_FILTERS = ['.uvu', 'uvvu', '.mp4', '.3gs', '.iso3', '3gp'];
const EXCLUDE_FILTERS = ['14_large.mp4', 'LargerThan4GB.mp4', 'a7-tone-oddities.mp4', 'compact-no-code-fec-1.iso3', 'compact-no-code-fec-2.iso3', 'mbms-fec.iso3']; // mp4box.js has issues with those. remove after fixing the problems

const CONFORMANCE_ROOT_DIR = './ISOBMFF-Conformance';
const OUT_DIR = './data';

let file_cnt = 0;
let excluded_cnt = 0;

function checkExtension(filter_array, filename) {
  return filter_array.some(function(ext){
    return filename.endsWith(ext);
  });
}

function isExcluded(string) {
  return EXCLUDE_FILTERS.some(function (text) {
    return string.endsWith(text);
  });
}

/********************************
 *          FEATURES
 ********************************/
let feature_ftyp = function(mp4boxfile) {
  for(let i=0; i<mp4boxfile.boxes.length; i++){
    if(mp4boxfile.boxes[i].type === 'ftyp') return true;
  }
  return undefined;
}
let feature_moov = function(mp4boxfile) {
  if(mp4boxfile.moov) {
    let mvhd = false, trak = false;
    for(let i=0; i<mp4boxfile.moov.boxes.length; i++){
      if(mp4boxfile.moov.boxes[i].type === 'mvhd') mvhd = true;
      else if(mp4boxfile.moov.boxes[i].type === 'trak') trak = true;
    }
    return mvhd && trak;
  }
  return undefined;
}
/**
 * return 'normal' if moov is before 'mdat', else return 'late'. Return 'undefined' if one of the boxes is missing
 */
let feature_order = function(mp4boxfile) {
  let boxes = mp4boxfile.boxes;
  let moov = -1, mdat = -1;
  for(let i=0; i<boxes.length; i++){
    if(boxes[i].type === 'moov') moov = boxes[i].start;
    if(boxes[i].type === 'mdat') mdat = boxes[i].start;
  }
  if (mdat < 0 || moov < 0 ) return 'unknown';
  else if (moov < mdat) return 'normal';
  else if (moov > mdat) return 'late';
  return undefined;
}
let feature_track_enabled = function(mp4boxfile) {
  if(mp4boxfile.moov) {
    if(mp4boxfile.moov.traks)
    {
      for (i = 0; i < mp4boxfile.moov.traks.length; i++) {
        if(mp4boxfile.moov.traks[i].tkhd.flags & MP4Box.BoxParser.TKHD_FLAG_ENABLED) return true;
      }
      return false;
    }
  }
  return undefined;
}
let feature_track_in_movie = function(mp4boxfile) {
  if(mp4boxfile.moov) {
    if(mp4boxfile.moov.traks)
    {
      for (i = 0; i < mp4boxfile.moov.traks.length; i++) {
        if(mp4boxfile.moov.traks[i].tkhd.flags & MP4Box.BoxParser.TKHD_FLAG_IN_MOVIE) return true;
      }
      return false;
    }
  }
  return undefined;
}
let feature_track_in_preview = function(mp4boxfile) {
  if(mp4boxfile.moov) {
    if(mp4boxfile.moov.traks)
    {
      for (i = 0; i < mp4boxfile.moov.traks.length; i++) {
        if(mp4boxfile.moov.traks[i].tkhd.flags & MP4Box.BoxParser.TKHD_FLAG_IN_PREVIEW) return true;
      }
      return false;
    }
  }
  return undefined;
}
let feature_free_skip = function(mp4boxfile) {
  let boxes = mp4boxfile.boxes;
  for(let i=0; i<boxes.length; i++){
    if(boxes[i].type === 'free' || boxes[i].type === 'skip') return true;
  }
  return false;
}
let feature_tref = function(mp4boxfile) {
  if(mp4boxfile.moov) {
    if(mp4boxfile.moov.traks)
    {
      for (i = 0; i < mp4boxfile.moov.traks.length; i++) {
        if(mp4boxfile.moov.traks[i].tref) return true;
      }
      return false;
    }
  }
  return undefined;
}
let feature_video = function(mp4boxfile) {
  if(mp4boxfile.moov) {
    if(mp4boxfile.moov.traks)
    {
      for (i = 0; i < mp4boxfile.moov.traks.length; i++) {
        if(mp4boxfile.moov.traks[i].mdia.hdlr.handler === 'vide') return true;
      }
      return false;
    }
  }
  return undefined;
}
let feature_audio = function(mp4boxfile) {
  if(mp4boxfile.moov) {
    if(mp4boxfile.moov.traks)
    {
      for (i = 0; i < mp4boxfile.moov.traks.length; i++) {
        if(mp4boxfile.moov.traks[i].mdia.hdlr.handler === 'soun') return true;
      }
      return false;
    }
  }
  return undefined;
}
let feature_meta = function(mp4boxfile) {
  if(mp4boxfile.moov) {
    if(mp4boxfile.moov.traks)
    {
      for (i = 0; i < mp4boxfile.moov.traks.length; i++) {
        if(mp4boxfile.moov.traks[i].mdia.hdlr.handler === 'meta') return true;
      }
      return false;
    }
  }
  return undefined;
}
let feature_ctts = function(mp4boxfile) {
  if(mp4boxfile.moov) {
    if(mp4boxfile.moov.traks)
    {
      for (i = 0; i < mp4boxfile.moov.traks.length; i++) {
        let trak = mp4boxfile.moov.traks[i];
        let ctts = trak.mdia.minf.stbl.ctts;
        if(ctts) return true;
      }
      return false;
    }
  }
  return undefined;
}
let feature_sync = function(mp4boxfile) {
  if(mp4boxfile.moov) {
    if(mp4boxfile.moov.traks)
    {
      for (i = 0; i < mp4boxfile.moov.traks.length; i++) {
        let trak = mp4boxfile.moov.traks[i];
        let stss = trak.mdia.minf.stbl.stss;
        if(stss) return true;
      }
      return false;
    }
  }
  return undefined;
}
let feature_copyright = function(mp4boxfile) {
  if(mp4boxfile.moov) {
    if(mp4boxfile.moov.udta)
      if(mp4boxfile.moov.udta.cprt) return true
    for (i = 0; i < mp4boxfile.moov.traks.length; i++) {
      let trak = mp4boxfile.moov.traks[i];
      if(trak.udta)
        if(trak.udta.cprt) return true
    }
    return false;
  }
  return undefined;
}
let feature_metaboxfile = function(mp4boxfile) {
  if(mp4boxfile.meta) return true;
  return false;
}
let feature_metaboxmovie = function(mp4boxfile) {
  if(mp4boxfile.moov) {
    if(mp4boxfile.moov.meta) return true;
  }
  return false;
}
let feature_metaboxtrack = function(mp4boxfile) {
  if(mp4boxfile.moov) {
    for (i = 0; i < mp4boxfile.moov.traks.length; i++) {
      let trak = mp4boxfile.moov.traks[i];
      if(trak.meta) return true;
    }
  }
  return false;
}
let feature_iteminfo = function(mp4boxfile) {
  if(mp4boxfile.meta) {
    if(mp4boxfile.meta.iinf) return true;
  }
  if(mp4boxfile.moov) {
    if(mp4boxfile.moov.meta) {
      if(mp4boxfile.moov.meta.iinf) return true;
    }
    for (i = 0; i < mp4boxfile.moov.traks.length; i++) {
      let trak = mp4boxfile.moov.traks[i];
      if(trak.meta) {
        if(trak.meta.iinf) return true;
      }
    }
  }
  return false;
}

/*******************************
 *           HELPERS
 *******************************/

let extract_features = function(file) {
  // init mp4box
  let mp4boxfile = MP4Box.createFile();

  // fixme: some files are too large to read them synchroniously, use streams instead
  // let stream = fs.createReadStream(file_path);
  // stream.on('data/end', ... => {} );
  let arrayBuffer = new Uint8Array(fs.readFileSync(file)).buffer;
  arrayBuffer.fileStart = 0;
  mp4boxfile.appendBuffer(arrayBuffer);

  // console.log(mp4boxfile);

  

  return { 
    "path": file,
    "ftyp": feature_ftyp(mp4boxfile),
    "moov": feature_moov(mp4boxfile),
    "order": feature_order(mp4boxfile),
    "track_enabled": feature_track_enabled(mp4boxfile),
    "track_in_movie": feature_track_in_movie(mp4boxfile),
    "track_in_preview": feature_track_in_preview(mp4boxfile),
    "free_skip": feature_free_skip(mp4boxfile),
    "tref": feature_tref(mp4boxfile),
    "video": feature_video(mp4boxfile),
    "audio": feature_audio(mp4boxfile),
    "meta": feature_meta(mp4boxfile),
    "ctts": feature_ctts(mp4boxfile),
    "sync": feature_sync(mp4boxfile),
    "copyright": feature_copyright(mp4boxfile),
    "metaboxfile": feature_metaboxfile(mp4boxfile),
    "metaboxmovie": feature_metaboxmovie(mp4boxfile),
    "metaboxtrack": feature_metaboxtrack(mp4boxfile),
    "iteminfo": feature_iteminfo(mp4boxfile)
    // "description": "todo"
  }
}

let is_valid_extension = function(string) {
  return INCLUDE_FILTERS.some(function (text) {
    return string.endsWith(text);
  });
}

/*******************************
 *           MAIN
 *******************************/

// walk(CONFORMANCE_ROOT_DIR, function(err, results) {
//   if (err) throw err;

//   let debug = 1;

//   console.log('Number of files', results.length);

//   for(let i=0; i<results.length; i++) {
//     let file = results[i];
//     if(debug) file = 'ISOBMFF-Conformance/isobmff/01_simple.mp4';
//     // if(debug) file = 'ISOBMFF-Conformance/isobmff/timed-metadata.mp4';
//     // if(debug) file = 'ISOBMFF-Conformance/nalu/svc/mp4-live-LastTime-depRep.mp4';
//     console.log('read file ', file);
//     let features = extract_features(file);
//     console.log(features);

//     if(debug) break;
//   }
// });


let walker = walk.walk(CONFORMANCE_ROOT_DIR).on('file', function(base, stats, next){  
  if( checkExtension(INCLUDE_FILTERS, stats.name) ) {
    file_cnt++;
    let file_path = path.join(base, stats.name);

    ///////////////////////////// remove begin
    let debug = 1;
    if(debug) {
      let file = 'ISOBMFF-Conformance/isobmff/01_simple.mp4';
      // let file = 'ISOBMFF-Conformance/isobmff/timed-metadata.mp4';
      // let file = 'ISOBMFF-Conformance/nalu/svc/mp4-live-LastTime-depRep.mp4';
      let features = extract_features(file);
      console.log(features);
      return;
    }
    ///////////////////////////// remove end

    if(!isExcluded(stats.name)) {
      // do some work
      console.log(stats.name);
      let features = extract_features(file_path);
      console.log(features);
    }
    else {
      excluded_cnt++;
      console.log('Excluded file: ' + file_path);
    }
  }
  next();
});


walker.on('end', function(){
  console.log('Number of files in conformance suite: ' + file_cnt);
  console.log('Number of files not found in xls: ' + excluded_cnt);
});