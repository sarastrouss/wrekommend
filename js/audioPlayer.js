// audioPlayer.js modified from fsahin's https://github.com/fsahin/artist-explorer/

(function () {
    'use strict';

    var audio = new Audio();
    var volume = 0.7;
    audio.volume = volume;

    var currentPlayingSongId = null;

    function playForTrack(track_to_play) {
        if (currentPlayingSongId == track_to_play.id) {
            return;
        }

        audio.setAttribute('src', track_to_play.preview_url);
        audio.load();
        audio.play();

        currentPlayingSongId = track_to_play.id;
    }

    function clearMusic() {
        if (audio) {
            audio.volume = 0;
        }
        currentPlayingSongId = null;
    }

    window.Player = {
        clearMusic: clearMusic,
        playForTrack: playForTrack,
    };
})();