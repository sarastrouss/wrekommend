var albums = [], 
	artists = {},
	counter = 0,
	chartSource,
	tracks = {}
	trackIdArray =[],
	playlist =[],
	PLAYLIST_LENGTH=20,
	chart;

// JSO.enablejQuery($);
// instantiate oauth2 library
var jso = new JSO({
    providerID: "spotify",
    client_id: "e57236bff64b4f06a96877583cb6b9ba",
    redirect_uri: "http://localhost:8888",
    authorization: "https://accounts.spotify.com/authorize",
    scopes: { request: ["playlist-modify-private"]}
});
// jso.getToken(function(token) {
//   window.open('index.html','_self')
// }, {
//   scopes: {
//           request: ["playlist-modify-private"],
//           require: ["playlist-modify-private"]
//       }
// });
// redirect to spotify & handle return to page

var getCurrentUser = function() {
	$.ajax({
		url:
		'https://api.spotify.com/v1/me',
		beforeSend: function (xhr) {
		    xhr.setRequestHeader('Authorization', 'Bearer ' +localStorage.getItem('token'));
		},
		success: function(response) {
			console.log(response);
			localStorage.setItem("userid", response.id);
		},
		error: function(error) {
			console.log(error);
		}
		
	});
}

jso.getToken(function(token) {
    console.log("I got the token: ", token);
    localStorage.setItem("token", token.access_token);
    getCurrentUser();
    history.replaceState({}, 'wrekommend', '/')

});
jso.callback();

var getArtist = function(query) {
	$.ajax({
		url:
		'https://api.spotify.com/v1/search',
		data: {
			q: query,
			type: 'artist'
		},
		success: function(response) {
			artists[response.artists.items[0].name] = {"values": []};
			findSimilar(response.artists.items[0].id);
			fetchTrack(response.artists.items[0].id);
			getArtistAlbumsId(response.artists.items[0].name, response.artists.items[0].id);
		}
	});
}

var getAlbums = function(artistName, albumIds) {
	$.ajax({
		url:
		'https://api.spotify.com/v1/albums/',
		data: {
			ids: albumIds.join(),
			market: 'US'
		},
		
		success: function(response) {

			for(i = 0; i < (response.albums.length); i++) {

				albums.push(response.albums[i]); 
				artists[artistName].values.push({
					x: (new Date(response.albums[i].release_date)),
					y: parseInt(response.albums[i].popularity),
					name: response.albums[i].name,
					first_track_id: response.albums[i].tracks.items[0].id
				});
			}
			counter++;
			if (counter === 21) {
				main();

				for (i = 0; i < trackIdArray.length;i+=100) {
					if ((i+100) > trackIdArray.length){
						slice = trackIdArray.slice(i,trackIdArray.length);
					} else {
						slice = trackIdArray.slice(i,i+100);
					}
					getAudioFeatures(slice);
				}
			} 
		}
	});
}

var main = function() {
	if(chartSource != null) {
		update();
	} else {
		renderViz();
	}
	for (album of albums) {
		for (track of album.tracks.items) {
			track.album_popularity = album.popularity;
			tracks[track.id] = track;
			trackIdArray.push(track.id);
		}
	}
	createPlaylist();
}


var getAudioFeatures = function(ids) {
	$.ajax({
		url:
		'https://api.spotify.com/v1/audio-features',
		beforeSend: function (xhr) {
		    xhr.setRequestHeader('Authorization', 'Bearer ' +localStorage.getItem('token'));
		},
		data: {
			ids: ids.join()
		},
		success: function(response) {
			for (track of response.audio_features) {
				tracks[track.id] = $.extend({}, tracks[track.id], track)
			}
		},
		error: function(error) {
			console.log(error);
		}
		
	});
}

var getArtistAlbumsId = function(artistName, artistId) {
	$.ajax({
		url:
		'https://api.spotify.com/v1/artists/'+ artistId +'/albums',
		
		data: {
			market: 'US',
			album_type: 'album,single'
		},
		success: function(response) {
			artists[artistName] = {"values": []};
			var albumIds = [];
			for(i = 0; i < (response.items.length); i++) {
				albumIds.push(response.items[i].id);
			}
			getAlbums(artistName, albumIds);
		}
	});
}

var findSimilar = function(artistId) {
	$.ajax({
		url:
		'https://api.spotify.com/v1/artists/' + artistId +'/related-artists',
		success: function(response) {
			for(i = 0; i < response.artists.length; i++) {
				getArtistAlbumsId(response.artists[i].name, response.artists[i].id);
				fetchTrack(artistId)
			}
		}
	});
}

var fetchTrack = function(artistId) {
	$.ajax({
		url:
		'https://api.spotify.com/v1/artists/' + artistId + '/top-tracks',
		data: {
			country: 'US'
		},
		success: function(response) {
			// fetchAudio(response.tracks.id);
		}
	});
}

// this is where it should work (oauth)
var fetchAudio = function(trackid) {
	$.ajax({
		url:
		'https://api.spotify.com/v1/audio-features/' + trackid,
		headers: {
			'Authorization': 'Bearer'+localStorage.getItem("token")
		},
		success: function(response) {
			//console.log("got the audio");
		}
	});
}




// bind this and/or addtracks to buttons
var createPlaylist = function() {
	$.ajax({
		type: "POST",
		url:
		'https://api.spotify.com/v1/users/'+localStorage.getItem("userid")+'/playlists',
		beforeSend: function (xhr) {
		    xhr.setRequestHeader('Authorization', 'Bearer ' +localStorage.getItem('token'));
		    xhr.setRequestHeader('Content-Type', 'application/json');
		},
		data: JSON.stringify({ 
			name: "Your Playlist",
			public: false
		}),
		success: function(response) {
			//store the current playlist
			localStorage.setItem("playlistid", response.id);


			playlist.push(albums[0].tracks.items[0].uri);
			//add tracks to newly created playlist
			addTracks(playlist);
			console.log(response);

		},
		error: function(error) {
			console.log(error);
		}
		
	});
}



var savePlaylistLink = function(playlistLink) {
	var widget = document.getElementById('widget');
	widget.setAttribute('href', playlistLink);
}

var generateRandomPlaylist = function() {
	var keys = Object.keys(tracks);
	for (i=0;i<PLAYLIST_LENGTH;i++) {
		playlist.push(tracks[keys[ keys.length * Math.random() << 0]].uri);
	}
	console.log(playlist);
	addTracks(playlist);

}

var generateDanceablePlaylist = function(target) {
	target = 0.7;
	playlist = [];
	var keys = Object.keys(tracks);
	var counter = 0;
	var found = {};
	for (i=0;i<trackIdArray.length;i++) {
		if (counter > PLAYLIST_LENGTH) {
			break;
		}
		track = tracks[keys[ keys.length * Math.random() << 0]];
		if (found[track.id] === true) {
			track = tracks[keys[ keys.length * Math.random() << 0]];
		} 
		found[track.id = true]
		if (track.danceability > (target-0.1) && track.danceability < (target+0.1)) {
			playlist.push(track.uri);
			counter++;
		}
	}

	addTracks(playlist);	
}

var addTracks = function(playlist_uris) {
	$.ajax({
		type: "POST",
		url: 'https://api.spotify.com/v1/users/'+localStorage.getItem("userid")+'/playlists/'+localStorage.getItem("playlistid")+'/tracks',
		beforeSend: function (xhr) {
		    xhr.setRequestHeader('Authorization', 'Bearer ' +localStorage.getItem('token'));
		    xhr.setRequestHeader('Content-Type', 'application/json');
		},
		data: JSON.stringify({ 
			uris: playlist_uris,
		}),
		// success: function(response) {
		// 	console.log(response);
		// },
		error: function(error) {
			console.log(error);
		}
		
	});
}

document.getElementById('search').addEventListener('keypress', function(e) {
	var target = e.target;
	var key = e.which || e.keyCode;
	if(key === 13) {
		$("#button1").show();
		$("#button2").show();
		$("#mute").show();
		albums = [], artists = {}, counter = 0;
		e.preventDefault();
		getArtist(document.getElementById('query').value);
	}
}, false);

$("#mute").click(function() {
	Player.clearMusic();
});

$("#button1").click(function() {
	createPlaylist();
	generateRandomPlaylist();
});

$("#button2").click(function() {
	createPlaylist();
	generateDanceablePlaylist();
});



// start d3

function renderViz() {
	nv.addGraph(function() {
		chart = nv.models.scatterChart()
                .color(d3.scale.category20().range());

  chart.tooltip.contentGenerator(function(obj) {

  	Player.playForTrack(tracks[obj.point.first_track_id]);
  	var popularity = obj.point.y;
  	var artist = obj.series[0].key;
  	var name = obj.point.name;
  	var release_date = d3.time.format('%Y-%m-%d')(new Date(obj.point.x));
      return "Artist: " + artist +"</br>" +
      			"Album: " + name +"</br>" +
      			"Release Date: " + release_date +"</br>" +
      			"Popularity: " + popularity +"</br>";

  });

  //Axis settings
  chart.xAxis.tickFormat(function(d) { return d3.time.format('%Y')(new Date(d)); })

  chart.yAxis.tickFormat(d3.format('d'));

  var myData = formatData();
  d3.select('#chart')
  .datum(myData)
  .call(chart);

  // Assign the SVG selction
	chartSource = d3.select('#chart').datum(myData);
	chartSource.transition().duration(500).call(chart);

  nv.utils.windowResize(chart.update);

  return chart;
});
}

function formatData() {
	var data = [];

	var index = 0;
	for (var artist in artists) {
		data.push({
			key: artist,
			values: artists[artist].values
		});
	}

	return data;
}

function update() {
    var data = formatData();
    chartSource.datum(data).transition().duration(500).call(chart);
    nv.utils.windowResize(chart.update);
};

