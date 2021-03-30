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
            alert("User logged in");

            document.getElementById("login_button").style.display = "none";
            document.getElementById("game").style.display = "block";
        } catch (error) {
            console.log(error);
        }

        return App.initWeb3();
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
    },

    flip: async function (side) {
        let amount = document.getElementById("amount").value;
        alert(side + ": " + amount);

        App.contracts.FlipInstance.flip(side == "heads" ? 0 : 1, {
            value: amount,
            from: accounts[0],
        }).on("receipt", function (receipt) {
            let betEvent = receipt.logs[0].args;
            console.log(betEvent);
            if (betEvent.win) {
                alert("You won!: " + betEvent.bet);
            } else {
                alert("You lost!: " + betEvent.bet);
            }
        });
    },
};

$(function () {
    $(window).on("load", function () {
        document.getElementById("login_button").onclick = App.login;
        document.getElementById("heads_button").onclick = function () {
            App.flip("heads");
        };
        document.getElementById("tails_button").onclick = function () {
            App.flip("tails");
        };
    });
});
