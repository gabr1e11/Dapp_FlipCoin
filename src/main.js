Moralis.initialize("sNHjLBIVwLQiXb5mEUhJZYChVEf57rzmQREZEPac");
Moralis.serverURL = "https://npsdzlgfq5z6.moralis.io:2053/server";

App = {
    web3Provider: null,
    contracts: {},
    accounts: {},

    login: async function () {
        try {
            user = await Moralis.User.current();
            if (!user) {
                user = await Moralis.Web3.authenticate();
            }
            console.log(user);

            await App.addWinners();
            await App.addLosers();
            await App.addTopBets();
        } catch (error) {
            console.log(error);
        }

        let result = await App.initWeb3();

        document.getElementById("login_button").style.display = "none";
        document.getElementById("logout_button").style.display = "block";
        document.getElementById("game").style.display = "block";
    },

    logout: async function () {
        await Moralis.User.logOut();

        App.clearStatistics();

        document.getElementById("login_button").style.display = "block";
        document.getElementById("logout_button").style.display = "none";
        document.getElementById("game").style.display = "none";
    },

    initWeb3: async function () {
        // Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("User denied account access");
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider(
                "http://localhost:7545"
            );
        }
        web3 = new Web3(App.web3Provider);

        accounts = await web3.eth.getAccounts();
        return App.initContract();
    },

    initContract: async function () {
        let contractAbi = await $.getJSON("FlipContract.json");

        App.contracts.Flip = TruffleContract(contractAbi);
        App.contracts.Flip.setProvider(App.web3Provider);

        App.contracts.FlipInstance = await App.contracts.Flip.deployed();

        App.contracts.FlipInstance.contract.events
            .bet("", null)
            .on("data", App.betEventReceived);
    },

    flip: async function (side) {
        let amount = document.getElementById("amount").value;
        alert(side + ": " + amount);

        App.contracts.FlipInstance.flip(side == "heads" ? 0 : 1, {
            value: amount,
            from: accounts[0],
        });
    },
    betEventReceived: function (event) {
        if (event.returnValues.win) {
            alert("You won!: " + event.returnValues.bet);
        } else {
            alert("You lost!: " + event.returnValues.bet);
        }
    },
    addWinners: async function () {
        let winners = await Moralis.Cloud.run("biggestWinners", {});

        winners.forEach((element) => {
            App.addRowToTable("top_winners", [
                element.objectId,
                element.total_sum,
            ]);
        });
    },
    addLosers: async function () {
        let losers = await Moralis.Cloud.run("biggestLosers", {});

        losers.forEach((element) => {
            App.addRowToTable("top_losers", [
                element.objectId,
                element.total_sum,
            ]);
        });
    },
    addTopBets: async function () {
        let bets = await Moralis.Cloud.run("biggestBets", {});

        bets.forEach((element) => {
            App.addRowToTable("top_bets", [
                element.user,
                element.bet,
                element.win,
            ]);
        });
    },
    addRowToTable: function (tableId, data) {
        let tableRow = document.createElement("tr");

        data.forEach((element) => {
            let newColumn = document.createElement("td");
            newColumn.innerHTML = element;
            tableRow.appendChild(newColumn);
        });

        document.getElementById(tableId).appendChild(tableRow);
    },
    clearStatistics: function () {
        App.clearTable("top_winners");
        App.clearTable("top_losers");
        App.clearTable("top_bets");
    },
    clearTable: function (tableId) {
        let table = document.getElementById(tableId);

        let rowCount = table.rows.length;
        for (var i = rowCount - 1; i > 0; i--) {
            table.deleteRow(i);
        }
    },
};

$(function () {
    $(window).on("load", function () {
        document.getElementById("login_button").onclick = App.login;
        document.getElementById("login_button").style.display = "block";

        document.getElementById("logout_button").onclick = App.logout;
        document.getElementById("logout_button").style.display = "none";

        document.getElementById("heads_button").onclick = function () {
            App.flip("heads");
        };
        document.getElementById("tails_button").onclick = function () {
            App.flip("tails");
        };
    });
});
