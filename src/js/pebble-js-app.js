var leagueStatsResponse;
var JSONWatchResponse;

//API: https://www.mashape.com/timtastic/league-of-legends-3
var APIKey = "dcBPaZASBY0es0vcexqDlaygHfbheuSC";

var summonerIdRequest = new XMLHttpRequest();
var summonerStatsRequest = new XMLHttpRequest();

function fetchSummonerId(server, summonername)
{
    //Summoner ID Request takes the provided Summoner Name and retrives the actual server ID for the player if required.
    summonerIdRequest.open('GET', "https://community-league-of-legends.p.mashape.com/api/v1.0/" + server + "/summoner/getSummonerByName/" + summonername, true);
    summonerIdRequest.setRequestHeader("X-Mashape-Authorization", APIKey);
    summonerIdRequest.onreadystatechange = function (e) 
    {
        if (summonerIdRequest.readyState == 4) 
        {
            if (summonerIdRequest.status == 200) 
            {
                //maybe write something if the server doesnt return what you want =/

                var JSONResponse = JSON.parse(summonerIdRequest.responseText);
                localStorage.setItem("summonerName", summonername);
                localStorage.setItem("summonerId", JSONResponse.summonerId);
                fetchSummonerDetails(server, JSONResponse.summonerId)
                //save it for the future
            }
            else 
            {
                //something went wrong?!
                error();
            }
        } 
        
    }
    summonerIdRequest.send(null);
}

function fetchSummonerDetails(server, summonerId) {
   
    //uses the Summoner ID to retrieve their ranked stats
    summonerStatsRequest.open('GET', "https://community-league-of-legends.p.mashape.com/api/v1.0/" + server + "/summoner/getLeagueForPlayer/" + summonerId, true);
    summonerStatsRequest.setRequestHeader("X-Mashape-Authorization", APIKey);
    summonerStatsRequest.onreadystatechange = function () 
    {
        if (summonerStatsRequest.readyState == 4) 
        {
            if (summonerStatsRequest.status == 200) 
            {
                leagueStatsResponse = JSON.parse(summonerStatsRequest.responseText);
                //error checking?!
                if(leagueStatsResponse.success != "false")
                {
                    for (var i = 0; i < leagueStatsResponse.entries.array.length; i++) 
                    {
                        //find the player mentioned
                        if (leagueStatsResponse.entries.array[i]["playerOrTeamName"] == localStorage["summonerName"].replace("+", " ")) 
                        {

                            //transform into formatted JSON
                            JSONWatchResponse = JSON.stringify({
                                player: leagueStatsResponse.entries.array[i]["playerOrTeamName"],
                                rank: leagueStatsResponse.entries.array[i]["tier"] + " " + leagueStatsResponse.entries.array[i]["rank"] + "(" + leagueStatsResponse.entries.array[i]["leaguePoints"] + " LP)",
                                league: leagueStatsResponse.entries.array[i]["leagueName"],
                                winloss: "W: " + leagueStatsResponse.entries.array[i]["wins"] + " - L: " + leagueStatsResponse.entries.array[i]["losses"]
                            });
                            break;
							
							//
                            //things you could use
							//----
                            //demotionWarning
                            //displayDecayWarning
                            //hotStreak
                            //timeUntilDecay
							//veteran
							//
                        }
                    }
                    console.log(JSONWatchResponse);
                    Pebble.sendAppMessage(
                    {
                        "player": leagueStatsResponse.entries.array[i]["playerOrTeamName"],
                        "rank": leagueStatsResponse.entries.array[i]["tier"] + " " + leagueStatsResponse.entries.array[i]["rank"] + "(" + leagueStatsResponse.entries.array[i]["leaguePoints"] + " LP)",
                        "winloss": "W: " + leagueStatsResponse.entries.array[i]["wins"] + " - L: " + leagueStatsResponse.entries.array[i]["losses"],
						"league": leagueStatsResponse.entries.array[i]["leagueName"]
                    });
                }
                else 
                {
                    //something went wrong?!
                    error();
                }

            }
        }  
    }
    summonerStatsRequest.send(null);
}

function error()
{
    console.log("Error");
}

// Set callback for the app ready event
Pebble.addEventListener("ready",
    function (e) {
        console.log("connect!" + e.ready);
        console.log(e.type);

        //if we have the information already!
        if(localStorage["summonerName"] != "" && localStorage["server"] != "")
        {
          fetchSummonerId(localStorage["server"], localStorage["summonerName"].replace("+", " "));
        }
		else
		{
			//otherwise we should display something to the user to tell them what to do =///
			//I'll work this out later TODO!!
			Pebble.sendAppMessage(
			{
				"player": "Error!",
				 "rank": "Please configure",
				 "winloss": "on Pebble App",
				 "league": ""
				});
			
		}
    });


//opens a web URL when the user wants to configure the application
Pebble.addEventListener("showConfiguration", function () {
    console.log("showing configuration");
    if(localStorage["summonerName"] || localStorage["server"])
    {
        Pebble.openURL('http://pyrozerox.com/lolpebble/configurable.html?name='+localStorage["summonerName"]+"&server="+localStorage["server"]);
    }
    else Pebble.openURL('http://pyrozerox.com/lolpebble/configurable.html');
    
});

//manipulate the returned JSON from the web form.
Pebble.addEventListener("webviewclosed", function (e) {
    console.log("configuration closed");
    // webview closed
    var options = JSON.parse(decodeURIComponent(e.response));
    console.log("Options = " + JSON.stringify(options));
	var summoner = options.summoner.replace("+", " ")
    //save the returned content for future reference
    localStorage.setItem("summonerName", summoner);
    localStorage.setItem("server", options.server);
	
    //use the data!
	if(localStorage["server"] && localStorage["summonerName"])
	{
		fetchSummonerId(localStorage["server"], localStorage["summonerName"]);	
	}
});