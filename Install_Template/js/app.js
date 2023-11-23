let templateListNotInstall = document.querySelector('.app-not-installed .monaco-list-rows').innerHTML;
let templateListInstalled = document.querySelector('.app-installed .monaco-list-rows').innerHTML;
let templateDetail = document.querySelector('.editor-container').innerHTML;
let tabHeader = document.querySelector('.tabs-container').innerHTML;
let base_url = "http://localhost:1880";
let recommendApp = [];
let installedApp = [];
let currentApp = {};

window.onload = function () {
    sessionStorage.clear();
    document.querySelector('.tabs-container').innerHTML = '';
    fetch(base_url + '/app')
        .then(response => response.json()).then(data => {
            fetch(base_url + '/installed').then(response => response.json()).then(installed => {
                let data_not_installed = data.filter(item1 => !installed.some(item2 => item1._id === item2._id));
                document.querySelector('.app-not-installed .monaco-list-rows').innerHTML = '';
                data_not_installed.forEach(element => {
                    element.isInstall = false;
                    const rendered = Mustache.render(templateListNotInstall, element);
                    document.querySelector('.app-not-installed .monaco-list-rows').innerHTML += rendered;
                });
            }).catch(function (error) {
                console.error(error);
            });
        })
        .catch(function (error) {
            console.error(error);
        });

    fetch(base_url + '/installed').then(response => response.json()).then(installed => {
        document.querySelector('.app-installed .monaco-list-rows').innerHTML = '';
        installed.forEach(element => {
            element.isInstall = true;
            const rendered = Mustache.render(templateListInstalled, element);
            document.querySelector('.app-installed .monaco-list-rows').innerHTML += rendered;
        });
    }).catch(function (error) {
        console.error(error);
    });

}


function openDetail(_id) {
    let tem = document.querySelector('.monaco-scrollable-element').innerHTML
    if (tem.trim() === "") {
        var newDiv = document.createElement("div");
        newDiv.className = "tabs-container";
        var container = document.querySelector('.monaco-scrollable-element');
        container.appendChild(newDiv);
    }
    document.querySelector('.split-view-view').style.display = 'block';
    fetch(base_url + '/app/' + _id)
        .then(response => response.json()).then(data => {
            fetch(base_url + '/installed').then(response => response.json()).then(installed => {
                data.isInstall = installed.some(item => item._id === data._id);
                document.querySelector('.editor-container').innerHTML = '';
                const renderedData = Mustache.render(templateDetail, data);
                const renderedTab = Mustache.render(tabHeader, data);
                const allTabs = document.querySelectorAll('.tab-actions-right');
                // allTabs.forEach((tab) => {
                //     if (!tab.id === (_id + ' ').trim()) {
                //         document.querySelector('.editor-container').innerHTML = renderedData;
                //         document.querySelector('.tabs-container').innerHTML += renderedTab;
                //         var tabs = document.querySelectorAll('.tab-actions-right')
                //         tabs.forEach((tab) => tab.classList.remove('active'));
                //         tabs[tabs.length - 1].classList.add('active')
                //     }
                // });
                document.querySelector('.editor-container').innerHTML = renderedData;
                document.querySelector('.tabs-container').innerHTML += renderedTab;
                var tabs = document.querySelectorAll('.tab-actions-right')
                tabs.forEach((tab) => tab.classList.remove('active'));
                tabs[tabs.length - 1].classList.add('active')

                var clickedElementId = _id;
                var storedIds = sessionStorage.getItem('clickedIds');
                var clickedIds = [];
                if (storedIds) {
                    clickedIds = JSON.parse(storedIds);
                }
                clickedIds.push(clickedElementId);
                sessionStorage.setItem('clickedIds', JSON.stringify(clickedIds));
            }).catch(function (error) {
                console.error(error);
            });
        })
        .catch(function (error) {
            console.error(error);
        });
}


function openDetailTab(_id) {
    document.querySelector('.split-view-view').style.display = 'block';
    fetch(base_url + '/app/' + _id)
        .then(response => response.json()).then(data => {
            document.querySelector('.editor-container').innerHTML = '';
            const renderedData = Mustache.render(templateDetail, data);
            document.querySelector('.editor-container').innerHTML = renderedData;

        })
        .catch(function (error) {
            console.error(error);
        });
    let tabClose = document.querySelectorAll(".tab-actions-right");
    tabClose.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabClose.forEach((tabActive) => tabActive.classList.remove('active'));
            tab.classList.add('active')
        });
    });
}


// function closeTab() {
//     let closeBtns = document.querySelectorAll(".tab-actions");
//     let tabClose = document.querySelectorAll(".tab-actions-right");
//     const count = tabClose.length
//     closeBtns.forEach((tab, index) => {
//         tab.addEventListener('click', () => {
//             tabClose[index].remove();
//             count--;
//         });
//     });
//     if (count <= 1) {
//         document.querySelector('.editor-instance').remove()
//         document.querySelector('.tabs-container').remove()
//     }
//     tabClose.forEach((tabActive) => tabActive.classList.remove('active'));
//     tabClose[tabClose.length-2].classList.add('active')
// }
function closeTab(div) {
    tabActive = JSON.parse(sessionStorage.getItem('clickedIds'));
    let index = tabActive.indexOf(div.id);
    if (tabActive.length < 2) {
        index = 1
    }
    div.remove();
    openDetailTab(tabActive[index - 1]);

    let tabClose = document.querySelectorAll(".tab-actions-right");
    tabClose.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabClose.forEach((tabActive) => tabActive.classList.remove('active'));
            tab.classList.add('active')
        });
    });
    document.getElementById(tabActive[index - 1]).click();
    if (index > -1) {
        tabActive.splice(index, 1);
    }
    sessionStorage.setItem('clickedIds', JSON.stringify(tabActive))
    // console.log(tabActive)
}

function showSpinner(isShow) {
    if (isShow) {
        document.querySelector('.spinner-custom.success').style.display = 'block';
        document.querySelector('.background').style.display = 'block';
        setTimeout(() => {
            document.querySelector('.spinner-custom.success').style.display = 'none';
            document.querySelector('.background').style.display = 'none';
        }, 5000)
    } else {
        document.querySelector('.spinner-custom.error').style.display = 'block';
        document.querySelector('.background').style.display = 'block';
        setTimeout(() => {
            document.querySelector('.spinner-custom.error').style.display = 'none';
            document.querySelector('.background').style.display = 'none';
        }, 5000)
    }
}

function installExtension(_id) {
    var myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Node-RED-API-Version", "v2");
    myHeaders.append("Content-Type", "application/json");

    fetch(base_url + '/app/' + _id)
        .then(response => response.json()).then(dataRes => {
            currentApp = dataRes;
            const data = JSON.parse(currentApp.flow);
            const param = data[0];
            param.nodes = [];
            param.configs = data.filter(x => x.id != param.id);

            var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: JSON.stringify(param),
                redirect: 'follow'
            };

            fetch(`${base_url}/flow`, requestOptions)
                .then(response => response.text())
                .then(result => {
                    result = JSON.parse(result)
                    // console.log(currentApp._id);
                    // sessionStorage.setItem('Id', JSON.stringify(clickedIds));
                    // console.log(result.id)
                    if (result.id) {
                        setTimeout(() => {
                            getResource(currentApp._id, result.id);
                        }, 200);
                        showSpinner(true);
                    } else {
                        showSpinner(false);
                    }
                })
                .catch(function (error) {
                    console.error(error);
                    showSpinner(false);
                });
        })
        .catch(function (error) {
            console.error(error);
        });
}

function getResource(appId, flowId) {
    var header = new Headers();
    header.append("Accept", "application/json");
    header.append("Node-RED-API-Version", "v2");

    var requestOptions = {
        method: "GET",
        headers: header,
        redirect: "follow",
    };

    fetch(base_url + "/app/install/" + appId + "/" + flowId, requestOptions)
        .then((response) => response.text())
        .then((result) => {
            // showMessage("install extension successfully");
            showSpinner(true);
            // console.log(result);
        })
        .catch((error) => { showSpinner(false); console.log("error", error) });
}


function deleteExtension(_id) {
    var myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Node-RED-API-Version", "v2");
    myHeaders.append("Content-Type", "application/json");

    fetch(base_url + '/installed/flowid')
        .then(response => response.json()).then(dataRes => {
            let foundObjectId = dataRes.find(item => item.app_id === _id).flow_id;
            var requestOptions = {
                method: 'DELETE',
                headers: myHeaders,
                redirect: 'follow'
            };

            fetch(base_url + '/flow/' + foundObjectId, requestOptions)
                .then(response => {
                    if (response.status === 204) {
                        deleteResource(_id)
                    } else {
                        showSpinner(false);
                    }
                })
                .catch(function (error) {
                    console.error(error);
                    showSpinner(false);
                });

            // response.text())
            // .then(result => {
            //     // result = JSON.parse(result)
            //     console.log(result.id);
            //     // // console.log(currentApp._id);
            //     // if (result.id) {
            //     //     setTimeout(() => {
            //     //         getResource(currentApp.id);
            //     //     }, 200);
            //     //     showSpinner(true);
            //     // } else {
            //     //     showSpinner(false);
            //     // }
            // })
        })
        .catch(function (error) {
            console.error(error);
        });
}

function deleteResource(app_id){
    fetch(base_url + "/app/delete/" + app_id)
    .then((response) => response.text())
    .then((result) => {
        // showMessage("install extension successfully");
        showSpinner(true);
        console.log(result);
    })
    .catch((error) => { showSpinner(false); console.log("error", error) });
}

$(document).ready(function () {
    $('#myForm').on('input', function (event) {
        event.preventDefault();
        const desc = document.querySelector('#searchForm').value
        $.ajax({
            url: base_url + '/app/search/' + desc,
            success: function (response) {
                if (response) {
                    document.querySelector('.app-not-installed .monaco-list-rows').innerHTML = '';
                    response.forEach(element => {
                        const rendered = Mustache.render(templateListNotInstall, element);
                        document.querySelector('.app-not-installed .monaco-list-rows').innerHTML += rendered;
                    });
                } else {
                    fetch(base_url + '/app')
                        .then(response => response.json()).then(data => {
                            document.querySelector('.app-not-installed .monaco-list-rows').innerHTML = '';
                            data.forEach(element => {
                                const rendered = Mustache.render(templateListNotInstall, element);
                                document.querySelector('.app-not-installed .monaco-list-rows').innerHTML += rendered;
                            });
                        })
                        .catch(function (error) {
                            console.error(error);
                        });
                }
            },
            error: function () {
                console.log('Error submitting the form.');
            }
        });
    });
});