var funk = {};
const cheerio = require("cheerio");
const arrayUnique = require("array-unique");
const dns = require("dns");
const CC = require("../models/domain.js");
const needle = require("needle");

funk.crt = function (post) {
    needle("get", "https://crt.sh/?q=%25." + post)
        .then (function(response) {
            var $ = cheerio.load(response.body);

            //Create temp array to store domains in
            var domains = [];

            //Grab the domain name
            $("td:nth-of-type(4)").map(function (index, element) {

                let domainName = $(this).text();
                if (!domainName.startsWith("*")) {
                    //Write to array
                    domains.push(domainName);
                }

            });

            //Remove duplicate domains
            var uniqueDomains = arrayUnique(domains);

            // Iterate over array and add to DB
            uniqueDomains.forEach(function (domain) {

                // Resolve CNames
                dns.resolveCname(domain, function (error, address) {
                    if (!error) {
                        CC.create({names: domain, cname: address}, function (error, insertedDomain) {
                            if (error) {
                                console.log(error)
                            } else {
                                console.log(insertedDomain);
                            }
                            ;
                        });
                    }
                    ;
                });
            });
        })
            .catch(function(error) {
        console.error("Something went wrong with CRT", error);
    })
};

funk.threatcrowd = function(post) {
    needle("get", "https://www.threatcrowd.org/searchApi/v2/domain/report/?domain=" + post)
        .then (function(response) {

            //assign body to constant.
            const body = response.body;

            //Check if threatcrowd has any information about the specific domain.
            if (body.response_code == "0") {
               console.log("no information about that domain");
            }
                //Insert every subdomain to the DB.
                body.subdomains.forEach(function (domain) {
                    // Resolve CNames
                    dns.resolveCname(domain, function (error, address) {
                        if (!error) {
                            CC.create({names: domain, cname: address}, function (error, insertedDomain) {
                                if (error) {
                                    console.log(error)
                                } else {
                                    console.log(insertedDomain);
                                };

                            });
                        };

                    });
                });
        })
        .catch(function(error) {
        console.error("Something went wrong with Threatcrowd", error);
        })
};

module.exports = funk;
