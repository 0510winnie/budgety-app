// Budget Controller

var budgetController = (function () {

    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function(totalIncome) {
        if(totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function() {
        return this.percentage;
    };

    var Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var calculateTotal = function (type) {
        var sum = 0;
        data.allItems[type].forEach(function (cur) {
            //sum = sum + cur.value
            sum += cur.value;
        });

        data.totals[type] = sum;
    };
    // our global data object (model)
    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1 //usually use -1 to express does not exist
    };

    return {
        addItem: function (type, des, val) {
            var newItem, ID;

            //[1 2 3 4 5], next ID = 6
            //but if we delete item from the array, it will be like this [1 2 4 6 8] then we will have two elements with the id of 6, next id should be 9

            //we want ID = last ID + 1

            //Create new ID
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }

            //Create new item based on 'inc' or 'exp' type
            if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, des, val);
            }

            //Push it into our data structure
            data.allItems[type].push(newItem);

            //Return the new element
            return newItem;
        },
        deleteItem: function(type, id) {
            var ids, index;
            //id = 6
            //data.allItems[type][id];
            //ids = [ 1, 2, 4, 6, 8]
            //index = 3

            ids = data.allItems[type].map(function(current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) {
                data.allItems[type].splice(index, 1);
                //at index 3 it will remove 1 item which is 6
            }


        },
        calculateBudget: function () {
            //calculate total income and expenses
            calculateTotal('exp');
            calculateTotal('inc');
            //calculate the budget: income - expenses
            data.budget = data.totals.inc - data.totals.exp;
            //calculate the percentage of income that we spent
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1; //-1 means non-existence
            }
        },
        calculatePercentages: function() {
            /* 
            a=20
            b=10
            c=40
            income = 100
            a=20/100=20%
            b=10/100=10%
            c=40/100=40%
             */
            data.allItems.exp.forEach(function(current){
                current.calcPercentage(data.totals.inc);
            });
        },
        getPercentages: function() {
            var allPerc = data.allItems.exp.map(function(cur) {
                return cur.getPercentage();
            });
            return allPerc; //an array
        },
        getBudget: function () {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
        },
        testing: function () {
            console.log(data);
        }
    };




})();



// UI Controller
var UIController = (function () {
    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month',
    };

    var formatNumber = function(num, type) {
        var numSplit, int, dec;
        /*
         + or - before number
         exactly 2 decimal points
         comma separating the thousands

         e.g. 

         2310.4567 -> + 2310.46
         2000 -> + 2,000.00
         */
        num = Math.abs(num);
        num = num.toFixed(2); //it's a string now

        numSplit = num.split('.');
        int = numSplit[0];

        if(int.length > 3) {
            int = int.substr(0, int.length - 3) + ', ' + int.substr(int.length - 3, 3); //input 2310, output 2,310
            //substr(start at position 0, read 1 number)
        }
        dec = numSplit[1];

        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;

    };

    var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    return {
        getInput: function () {

            //so how to return all these 3 variables? the best solution is probably return an object containing these 3 as properties.
            return {
                type: document.querySelector(DOMstrings.inputType).value, //value property, will be either inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
                //now we have 3 input values stored in 3 variables, but remember the controller will call this method and it needs to receive back all the values, so here we need to return the values.
            };
        },
        addListItem: function (obj, type) {
            var html, newHtml, element;
            // Create HTML string with placeholder text

            if (type === 'inc') {
                element = DOMstrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            } else if (type === 'exp') {
                element = DOMstrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }

            //Replace placeholder text with some actual data
            newHtml = html.replace('%id%', obj.id);
            //cannot use html since the id we replaced above will be gone
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            //Insert the HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
            //so now it will be inserted as the last child inside the income/expense container
        },
        deleteListItem: function(selectorID) {
            //we cannot simply delete an element in JavaScript, we have to delete a child, so we need to first find out its parent and then delete the child element, so we need to move up the DOM
            var el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);
        },
        clearFields: function () {
            var fields, fieldsArr;
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
            //now the field variable holds the result for this selection
            //the querySelectorAll method return a list which is similar to an array but lists don't have many methods to use as arrays.

            var fieldsArr = Array.prototype.slice.call(fields);

            fieldsArr.forEach(function (current, index, array) {
                current.value = "";
            });

            fieldsArr[0].focus();
        },
        displayBudget: function (obj) {
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';
            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');

            if (obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent =  '----';
            }

        },
        displayPercentages: function(percentages) {
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);

            

            nodeListForEach(fields, function(current, index) {
                if(percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '---';
                }
            });
        },
        displayMonth: function() {
            var now, year, months, month;
            now = new Date(); // return data of today

            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            month = now.getMonth();
            year = now.getFullYear();  // 'now' variable inherits many methods from the Date prototype 
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
        },
        changeType: function() {
            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue
            ); //this returns a node list
            
            nodeListForEach(fields, function(cur) {
                cur.classList.toggle('red-focus');
            });

            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        },
        getDOMstrings: function () {
            return DOMstrings;
        }
    };

})();



//Global App Controller
var controller = (function (budgetCtrl, UICtrl) {
    var setupEventListeners = function () {

        var DOM = UICtrl.getDOMstrings();

        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);
        // It doesn't need to be an anonymous function, we can simply pass a stand alone function into the addEventListener method, and again, we dont' need () the call operator because it's a callback, we don't want to call it here, it's a callback so the event listener will call it for us.

        document.addEventListener('keypress', function (event) {
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });
        //the event is click
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changeType);
        //add an event listener to handle the change event

    }

    var UpdateBudget = function () {
        //1. calculate the budget
        budgetCtrl.calculateBudget();
        //2. return the budget (we return it in the budget controller so we need to store the object into variable)
        var budget = budgetCtrl.getBudget();

        //3. display the budget on the UI
        // console.log(budget);
        UICtrl.displayBudget(budget);
    };

    var updatePercentages = function() {
        //1. Calculate percentages
        budgetCtrl.calculatePercentages();
        //2. Read percentage from the budget controller
        var percentages = budgetCtrl.getPercentages();
        //3. Update the UI with the new percentage
        UICtrl.displayPercentages(percentages);
    }

    var ctrlAddItem = function () {
        var input, newItem;
        //1. get the field input data
        input = UICtrl.getInput();
        // console.log(input);

        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
            //2. add the item to the budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);
            //3. add the item to the UI
            UICtrl.addListItem(newItem, input.type);
            //4. clear the field
            UICtrl.clearFields();
            //5. calculate and update budget
            UpdateBudget();
            //6. calculate and update percentages
            updatePercentages();

        } else {
            alert('Please enter all the fields.');
        }

    };
    
    //we need to pass event object into the function, remember the callback function of the addeventlistener function always has access to this event object
    var ctrlDeleteItem = function(event) {
            var itemID, splitID, type, ID;
            itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
            //there is only one id in the DOM, so if you click other place, there will be no id

            //we want things to happen only if the id is defined
            //this will work because it will be coerce/ converse to true if itemID exists, if it doesn't then will be false
            if(itemID) {
                    //inc-1
                    splitID = itemID.split('-');
                    //split returns an array ["inc","1"]
                    type = splitID[0];
                    ID = parseInt(splitID[1]);

                    //1. delete the item from the data structure
                    budgetCtrl.deleteItem(type, ID);
                    //2. delete the item from the user interface
                    UICtrl.deleteListItem(itemID);
                    //3. update and show the new budge
                    UpdateBudget();
                    //4. update the percentages
                    updatePercentages();
            }
    }


    return {
        init: function () {
            console.log('application has started.');
            UICtrl.displayMonth();
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            setupEventListeners();
        }
    };



})(budgetController, UIController);

controller.init();