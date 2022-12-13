import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAccountRecords from '@salesforce/apex/TablularReportHandler.getAccountRecords';
import getAccountRecordsWired from '@salesforce/apex/TablularReportHandler.getAccountRecordsWire';
import getAccountWithStartARR from '@salesforce/apex/TablularReportHandler.getAccountWithStartARR';
import totalRecords from '@salesforce/apex/TablularReportHandler.totalRecords';



const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default class TabularReport extends LightningElement {

    @track arrTableColumns = [
        {
            label: "Year",
            fieldName: "year",
            cellAttributes: {
                alignment: "center"
            }
        },
        {
            label: "Amount",
            fieldName: "amount",
            type: 'currency',
            cellAttributes: {
                alignment: "center"
            },
            typeAttributes: {
                currencyCode: "CAD",
                minimumFractionDigits: "0",
                maximumFractionDigits: "2"
            }
        }
    ];

    @track monthOptions = [
        { label: 'Jan', value: 'Jan' },
        { label: 'Feb', value: 'Feb' },
        { label: 'Mar', value: 'Mar' },
        { label: 'Apr', value: 'Apr' },
        { label: 'May', value: 'May' },
        { label: 'Jun', value: 'Jun' },
        { label: 'Jul', value: 'Jul' },
        { label: 'Aug', value: 'Aug' },
        { label: 'Sep', value: 'Sep' },
        { label: 'Oct', value: 'Oct' },
        { label: 'Nov', value: 'Nov' },
        { label: 'Dec', value: 'Dec' }
    ];                                          // list of months options for combobox.

    @track yearOptions = [];           // list of years options for combobox.
    @track yearList = [];
    @track mrrDatalist = [];           // contract dataset for MRR table.
    @track dataListContainer = [];           // primary dataset list.
    @track columnsList = [];           // column dataset for MRR table.
    @track columnsContainer = [];           // primary column set list.
    @track monthlyDataList = [];           // filtered dataset of contract with monthly payment term.
    @track biAnnualDataList = [];           // filtered dataset of contract with bi-annual payment term.
    @track annualDataList = [];           // filtered dataset of contract with annual payment term.
    @track quarterlyDataList = [];           // filtered dataset of contract with quarterly payment term.
    @track aggregateDataList = [];           // dataset of aggregated data (Total & Average) for cash flow table.
    @track aggregateColumnsList = [];           // columns dataset for cash flow table.
    @track retrievedYears = [];
    @track arrDatalist = [];
    @track arrColumnList = [];
    @track calculatedArrAmountAndYear = [];

    wiredDataError;
    mrrDataError;
    arrDataError;

    totalAccountRecords;

    startYearComboboxValue = '';
    startMonthComboboxValue = '';

    endYearComboboxValue = '';
    endMonthComboboxValue = '';

    currentFirstIndex = 0;
    currentLastIndex = 12;

    mrrOffset = 0;
    mrrRowLimit = 10;
    arrOffset = 0;
    arrRowLimit = 10;

    startMonthAndYearHelpText = '';
    endMonthAndYearHelpText = '';

    totalCompletePages;
    currentPageNumberIndex = 0;

    disableLeft = true;
    disableRight = false;
    disableReset = true;
    disableCombox = false;

    totalAccountRecords = 0;
    mrrInfiniteLoading = true;
    arrInfiniteLoading = true;

    showSpinner = true;
    showDatatable = false;

    notUpdateColumn = true;

    @wire(getAccountRecordsWired)
    accountRecords({ error, data }) {

        if (data) {

            this.wiredDataError = undefined;

            const contractStartMonthAndYear = this.formatDate(data[0].contractStartDate);
            this.columnsContainer = this.setLabels(contractStartMonthAndYear);
            this.totalCompletePages = Math.floor(this.columnsContainer.length / 12);
            this.columnsList = this.columnsContainer.slice(this.currentfirstIndex, this.currentLastIndex);
            this.aggregateColumnsList = [...this.columnsList];
            this.arrColumnList = [...this.columnsList];
            this.appendARRNameField();
            this.appendNameField();
            this.appendMRRNameField();
            this.getAllYears();

            let startMonthYearRangeInfo = this.columnsContainer[0]["fieldName"];
            let endMonthYearRangeInfo = this.columnsContainer[this.columnsContainer.length - 1]["fieldName"];
            this.startMonthAndYearHelpText = `\u2022 Valid start month for ${startMonthYearRangeInfo.split('-')[1]} is ${startMonthYearRangeInfo.split('-')[0]}.`;
            this.endMonthAndYearHelpText = `\u2022 Valid end month for ${endMonthYearRangeInfo.split('-')[1]} is ${endMonthYearRangeInfo.split('-')[0]}.`;

            let counter = 0;

            console.log(data[0]);

            for (let item of data) {


                if (item.paymentTerm === 'Annual') {
                    const amount = item.amountARR;
                    const ARR = item.ARR;
                    this.dataListContainer.push(this.getDataListLabelsForAnnually(item.name, amount.toFixed(2), item.contractStartDate, item.churnDate, ARR));
                    // this.dataList = [...this.dataListContainer];
                }


                if (item.paymentTerm === 'Bi-Annual') {
                    const amount = item.amountARR / 2;
                    const ARR = item.ARR;
                    this.dataListContainer.push(this.getDataListLabelsForBiAnnually(item.name, amount.toFixed(2), item.contractStartDate, item.churnDate, ARR));
                    // this.dataList = [...this.dataListContainer];
                }

                if (item.paymentTerm === 'Quarterly') {
                    const amount = item.amountARR / 4;
                    const ARR = item.ARR;
                    this.dataListContainer.push(this.getDataListLabelsForQuarterly(item.name, amount.toFixed(2), item.contractStartDate, item.churnDate, ARR));
                    // this.dataList = [...this.dataListContainer];
                }

                if (item.paymentTerm === 'Monthly') {
                    const amount = item.amountARR / 12;
                    const ARR = item.ARR;
                    this.dataListContainer.push(this.getDataListLabelsForMonthly(item.name, amount.toFixed(2), item.contractStartDate, item.churnDate, ARR));
                    // this.dataList = [...this.dataListContainer];
                }

                counter++;
            }


            // console.log({ counter });
            // this.calculateAnnualRecurringRevenue();
            this.calculateTotalSumByMonth();
            this.calculateAverageByMonth();
            this.calculateARR();
            // this.calculateARRMonthly();

            this.showSpinner = false;

            // for (let d of this.dataListContainer) {
            //     console.log(JSON.stringify(d, null, 2));
            // }

            // console.log(JSON.stringify(this.arrColumnList));

        } else if (error) {
            // console.log(error);
            this.dataListContainer = undefined;
            this.wiredDataError = error;
        }

    }

    connectedCallback() {
        this.loadInit();
        this.loadMRRData();
        // this.loadARRData();
    }

    loadInit() {
        return totalRecords()
            .then((data) => {
                // console.log({ data });
                this.totalAccountRecords = data;
                // console.log(JSON.stringify(this.totalAccountRecords));
            })
            .catch((error) => {
                throw error;
            })
    }

    loadMRRData() {
        return getAccountRecords({ limitSize: this.mrrRowLimit, offSet: this.mrrOffset })
            .then(data => {
                this.mrrDataError = undefined;

                const updatedData = [];

                for (let item of data) {

                    if (item.paymentTerm === 'Annual') {
                        const amount = item.amountARR;
                        updatedData.push(this.getDataListLabelsForAnnually(item.name, amount.toFixed(2), item.contractStartDate, item.churnDate));
                        // this.dataList = [...this.dataList, ...updatedData];
                    }


                    if (item.paymentTerm === 'Bi-Annual') {
                        const amount = item.amountARR / 2;
                        updatedData.push(this.getDataListLabelsForBiAnnually(item.name, amount.toFixed(2), item.contractStartDate, item.churnDate));
                        // this.dataList = [...this.dataList, ...updatedData];
                    }

                    if (item.paymentTerm === 'Quarterly') {
                        const amount = item.amountARR / 4;
                        updatedData.push(this.getDataListLabelsForQuarterly(item.name, amount.toFixed(2), item.contractStartDate, item.churnDate));
                        // this.dataList = [...this.dataList, ...updatedData];
                    }

                    if (item.paymentTerm === 'Monthly') {
                        const amount = item.amountARR / 12;
                        updatedData.push(this.getDataListLabelsForMonthly(item.name, amount.toFixed(2), item.contractStartDate, item.churnDate));
                        // this.dataList = [...this.dataList, ...updatedData];
                    }
                }

                this.mrrDatalist = [...this.mrrDatalist, ...updatedData];

                // console.log("mrrDatalist ::\n", JSON.stringify(this.mrrDatalist));
            })
            .catch(error => {
                this.mrrDataError = error;
                this.mrrDatalist = undefined;
                // console.log({error});
            })
    }

    loadMoreMRRData(event) {

        console.log("LoadMoreMRRData");

        const tempData = this.mrrDatalist;
        const { target } = event;
        target.isLoading = true;

        this.mrrOffset = this.mrrOffset + this.mrrRowLimit;

        const localRowOffSet = +JSON.stringify(this.mrrOffset);
        const localRecordsCount = +JSON.stringify(this.totalAccountRecords);

        // console.log(JSON.stringify({localRowOffSet}), typeof localRowOffSet);
        // console.log(JSON.stringify({localRecordsCount}), typeof localRecordsCount);

        if (localRowOffSet >= localRecordsCount) {
            // console.log("Inside If");
            this.mrrInfiniteLoading = false;
            target.isLoading = false;
        } else {
            // console.log("Inside Else");
            this.loadMRRData()
                .then(() => {
                    target.isLoading = false
                });
        }


    }

    /*
    loadARRData() {
        return getAccountWithStartARR({ arrRowLimit: this.arrRowLimit, arrOffset: this.arrOffset })
            .then(data => {

                this.arrDataError = undefined;

                // for (let item of data) {
                //     const totalAmount = item.amountARR + item.ARR;
                //     this.arrDatalist.push(this.getArrDataLabels(item.name, totalAmount, item.contractStartDate, item.churnDate));
                // }

                const updatedData = [];

                for (let item of data) {
                    const totalARRAmount = item.amountARR + item.ARR;
                    updatedData.push(this.getArrDataLabels(item.name, totalARRAmount, item.contractStartDate, item.churnDate));
                }

                this.arrDatalist = [...this.arrDatalist, ...updatedData];

                // console.log("arrDatalist == \n", JSON.stringify(this.arrDatalist));

            })
            .catch(error => {
                this.arrDatalist = undefined;
                this.arrDataError = error;
                // console.log({error});
            })
    }
    */

    /*
    loadMoreARRData(event) {

        console.log("LoadMoreARRData");

        const tempDate = this.arrDatalist;
        const { target } = event;
        target.isLoading = true;
        this.arrOffset = this.arrOffset + this.arrRowLimit;


        // console.log(JSON.stringify(this.totalAccountRecords));

        const localRowOffSet = +JSON.stringify(this.arrOffset);
        const localRecordsCount = +JSON.stringify(this.totalAccountRecords);

        // console.log(JSON.stringify({localRowOffSet}), typeof localRowOffSet);
        // console.log(JSON.stringify({localRecordsCount}), typeof localRecordsCount);

        if (localRowOffSet >= localRecordsCount) {
            console.log("Inside If");
            this.arrInfiniteLoading = false;
            target.isLoading = false;
        } else {
            console.log("Inside Else");
            // this.loadData()
            //     .then(()=> {
            //         target.isLoading = false;
            // });
            this.loadARRData()
                .then(() => {
                    target.isLoading = false
                });
        }


    }
    */

    getAllYears() {

        let result = [];

        for (let column of this.columnsContainer) {
            this.retrievedYears.push(column.fieldName);
            result.push(column.fieldName.split('-')[1]);
        }

        // const unique = result.filter((val, idx, self) => self.indexOf(val) === idx);
        const unique = new Set(result);
        result = [...unique];

        // for (let item of result) {
        //     this.yearOptions = [...this.yearOptions, {label: item, value: item}];
        // }

        this.yearOptions = result.map((ele) => { return { label: ele, value: ele }; });
        this.yearList = [...result];

    }

    // month difference utility method
    monthDiff(d1, d2) {
        // console.log(JSON.stringify(d1));
        // console.log(JSON.stringify(d2));
        let mont;
        mont = (d2.getFullYear() - d1.getFullYear()) * 12;
        // console.log(JSON.stringify({mont}));
        mont -= d1.getMonth();
        // console.log(JSON.stringify({mont}));
        mont += d2.getMonth();
        // console.log(JSON.stringify({mont}));
        return mont;
    }

    // format the column heading ex: Jan-2021
    formatDate(rawDate) {
        const tempDate = new Date(rawDate);
        return `${months[tempDate.getMonth()]}-${tempDate.getFullYear()}`;
    }

    // appends the name column to main column list
    appendNameField() {
        this.columnsList.unshift({
            label: '',
            fieldName: 'name'
        });
    }

    appendMRRNameField() {
        this.aggregateColumnsList.unshift({
            label: 'Monthly',
            fieldName: 'name'
        });
    }

    appendARRNameField() {
        this.arrColumnList.unshift({
            label: '',
            fieldName: 'name'
        });
    }

    // set labels of data row for columns
    setLabels(firstDate) {

        const labels = [];
        const todayDate = new Date();
        const startDate = new Date(firstDate);

        const result = this.monthDiff(startDate, todayDate);

        for (let i = 0; i < result; i++) {

            const tempStartDate = new Date(startDate);
            const tempDate = new Date(tempStartDate.setMonth(tempStartDate.getMonth() + i));

            labels.push({
                label: this.formatDate(tempDate),
                fieldName: this.formatDate(tempDate),
                type: 'currency',
                cellAttributes: {
                    alignment: "center"
                },
                typeAttributes: {
                    currencyCode: "CAD",
                    minimumFractionDigits: "0",
                    maximumFractionDigits: "2"
                }
            });

        }

        return labels;
    }

    getArrDataLabels(name, arrAmount, startDate, endDate) {

        const tStartDate = new Date(startDate);
        const tEndDate = endDate === '0000-00-00' ? new Date() : new Date(endDate);

        const monthDifference = this.monthDiff(tStartDate, tEndDate);

        const result = {
            'name': name
        }

        for (let i = 0; i < monthDifference; i++) {

            const tempStartDate = new Date(startDate);
            const tempDate = new Date(tempStartDate.setMonth(tempStartDate.getMonth() + i));

            if (
                tempDate.getDate() === tStartDate.getDate() &&
                tempDate.getMonth() === tStartDate.getMonth() &&
                tempDate.getFullYear() !== tStartDate.getFullYear()
            ) {
                result[this.formatDate(tempDate)] = arrAmount;
            }
        }

        return result;
    }

    getDataListLabelsForMonthly(name, value, startDate, endDate, arr) {

        const tStartDate = new Date(startDate);
        const tEndDate = endDate == '0000-00-00' ? new Date() : new Date(endDate);

        const monthDifference = this.monthDiff(tStartDate, tEndDate);
        tStartDate.setDate(1);

        // console.log(JSON.stringify(name));
        // console.log(JSON.stringify(monthDifference));

        const result = {
            'name': name
        };
        if (arr !== undefined) result["arr"] = arr;

        for (let i = 0; i < monthDifference; i++) {

            const tempStartDate = new Date(tStartDate);
            const tempDate = new Date(tempStartDate.setMonth(tempStartDate.getMonth() + i));

            result[this.formatDate(tempDate)] = value;
        }

        // if (name === 'Account-133') {
        //     console.log(JSON.stringify(name));
        //     console.log(JSON.stringify(monthDifference));
        //     console.log(result);
        // }

        return result;

    }

    getDataListLabelsForBiAnnually(name, value, startDate, endDate, arr) {

        const tStartDate = new Date(startDate);
        const tEndDate = endDate == '0000-00-00' ? new Date() : new Date(endDate);

        const monthDifference = this.monthDiff(tStartDate, tEndDate);
        tStartDate.setDate(1);

        const result = {
            'name': name
        };
        if (arr !== undefined) result["arr"] = arr;

        for (let i = 0; i < monthDifference; i += 6) {

            const tempStartDate = new Date(tStartDate);
            const tempDate = new Date(tempStartDate.setMonth(tempStartDate.getMonth() + i));

            result[this.formatDate(tempDate)] = value;
        }

        return result;
    }


    getDataListLabelsForAnnually(name, value, startDate, endDate, arr) {

        const tStartDate = new Date(startDate);
        const tEndDate = endDate == '0000-00-00' ? new Date() : new Date(endDate);

        const monthDifference = this.monthDiff(tStartDate, tEndDate);
        tStartDate.setDate(1);

        const result = {
            'name': name
        };
        if (arr !== undefined) result["arr"] = arr;

        for (let i = 0; i < monthDifference; i += 12) {

            const tempStartDate = new Date(tStartDate);
            const tempDate = new Date(tempStartDate.setMonth(tempStartDate.getMonth() + i));

            result[this.formatDate(tempDate)] = value;
        }

        return result;
    }

    getDataListLabelsForQuarterly(name, value, startDate, endDate, arr) {

        const tStartDate = new Date(startDate);
        const tEndDate = endDate == '0000-00-00' ? new Date() : new Date(endDate);

        const monthDifference = this.monthDiff(tStartDate, tEndDate);
        tStartDate.setDate(1);

        const result = {
            'name': name
        };
        if (arr !== undefined) result["arr"] = arr;

        for (let i = 0; i < monthDifference; i += 3) {


            const tempStartDate = new Date(tStartDate);
            const tempDate = new Date(tempStartDate.setMonth(tempStartDate.getMonth() + i));

            result[this.formatDate(tempDate)] = value;
        }

        return result;
    }

    // calculateAnnualRecurringRevenue() {

    //     // console.log(JSON.stringify(this.yearList));

    //     let counter = 1;
    //     const years = [...this.yearList];
    //     const results = {};
    //     // console.log(years);

    //     for (let year of years) {
    //         results[year] = 0;
    //     };

    //     // console.log(results);

    //     for (let data of this.dataListContainer) {

    //         const tempObj = JSON.parse(JSON.stringify(data));
    //         delete tempObj["name"];

    //         for (let [monthAndYear, amount] of Object.entries(tempObj)) {
    //             if (this.yearList.includes(monthAndYear.split("-")[1])) {
    //                 results[monthAndYear.split("-")[1]] += +amount;
    //             }
    //         }
    //     }

    //     for (let [key, value] of Object.entries(results)) {
    //         this.calculatedArrAmountAndYear = [...this.calculatedArrAmountAndYear, { "year": key, "amount": value }];
    //     }
    // }

    // sumo
    calculateTotalSumByMonth() {

        const tempObj = {};
        let flag = 0;

        try {
            for (let column of this.columnsContainer) {

                flag++;
                let total = 0;

                for (let data of this.dataListContainer) {
                    if (data.hasOwnProperty(column.fieldName)) {
                        total += +data[column.fieldName];
                    }
                }

                if (flag === this.columnsContainer.length - 1) {
                    tempObj["name"] = "Total Cash Flow";
                }

                if (total > 0) {
                    tempObj[column.fieldName] = total;
                }
            }
        } catch (error) {
            throw new error;
        }

        this.aggregateDataList.push({ ...tempObj });
    }

    calculateARRMonthly2() {

        // const tempObj = {};
        // let flag = 0;
        // let previousMonth = 0;
        // let total = 0;

        // for (let column of this.columnsContainer) {
        //     tempObj[column.fieldName] = 0;
        // }

        // console.log(JSON.stringify(tempObj, null, 2));

        // for (let column of this.columnsContainer) {
        //     flag++;

        //     if (tempObj[column.fieldName] > 0) {

        //     } else {
        //         for (let data of this.dataListContainer) {
        //             if (data.hasOwnProperty(column.fieldName)) {
        //                 total += +data[column.fieldName] + +data["arr"] + previousMonth;
        //                 previous = 
        //             }
        //         }
        //     }
        // }

    }

    // calculateARRMonthly() {

    //     const tempData = JSON.parse(JSON.stringify(this.aggregateDataList[2]));
    //     for (let data in tempData) {
    //         console.log(JSON.stringify(data, null, 2));
    //     }
    //     const result = {};

    //     for (let [key, value] of Object.entries(tempData)) {
    //         console.log({key}, {value});
    //         if (key !== "name") {
    //             result[key] = (+value / 12);
    //         } else {
    //             result[key] = "Monthly ARR";
    //         }
    //     }

    //     console.log(JSON.stringify(result));

    //     this.aggregateDataList.push({...result});

    // }

    calculateARR() {

        const tempObj = {};
        let flag = 0;
        let previousMonth = 0;
        let total = 0;
        let currentARR = 0;
        let passedARRList = [];

        try {
            for (let column of this.columnsContainer) {

                flag++;


                for (let data of this.dataListContainer) {

                    if (data.hasOwnProperty(column.fieldName)) {

                        console.log("total => ", JSON.stringify(total));
                        console.log(`Month = ${JSON.stringify(column.fieldName)} and value = ${JSON.stringify(+data[column.fieldName])}`);
                        console.log("arr => ", JSON.stringify(+data["arr"]));
                        console.log("previous month before => ", JSON.stringify(previousMonth));

                        if (!passedARRList.includes(+data["arr"])) {

                        }

                        if (+data["arr"] !== currentARR && !passedARRList.includes(+data["arr"])) {
                            passedARRList.push(+data["arr"]);
                            currentARR += +data["arr"];
                        }

                        console.log("Current total ARR ==> ", JSON.stringify(currentARR));

                        total = +data[column.fieldName] + currentARR + previousMonth;
                        previousMonth += +data[column.fieldName];
                    }

                    console.log("previous month after => ", JSON.stringify(previousMonth));
                }



                if (flag === this.columnsContainer.length - 1) {
                    tempObj["name"] = "ARR";
                }

                if (total > 0) {
                    tempObj[column.fieldName] = total;
                }
            }
        } catch (error) {
            console.error(error);
        }

        this.aggregateDataList.push({ ...tempObj });

    }

    // avmo
    calculateAverageByMonth() {

        let flag = 0;
        const tempObj = {};

        for (let column of this.columnsContainer) {

            flag++;
            let total = 0;
            let counter = 0;

            for (let data of this.dataListContainer) {
                if (data.hasOwnProperty(column.fieldName)) {
                    total += +data[column.fieldName];
                    counter++;
                }
            }

            tempObj[column.fieldName] = total / counter;

            if (flag === this.columnsContainer.length - 1) {
                tempObj["name"] = "Average Cash Flow";
            }
        }

        this.aggregateDataList.push({ ...tempObj });
    }

    // previous button handler
    handlePreviousYears() {

        this.showSpinner = true;

        const timeout = setTimeout(() => {

            this.columnsList.shift();

            if (this.currentFirstIndex > 0) {

                this.currentFirstIndex -= 12;
                this.currentLastIndex -= 12;

                if (this.currentPageNumberIndex >= 0 && --this.currentPageNumberIndex == 0) {
                    this.disableLeft = true;
                }

                if (this.totalCompletePages != this.currentPageNumberIndex) {
                    this.disableRight = false;
                }
            }

            this.columnsList = this.columnsContainer.slice(this.currentFirstIndex, this.currentLastIndex);
            this.aggregateColumnsList = [...this.columnsList];
            this.arrColumnList = [...this.columnsList];
            this.appendARRNameField();
            this.appendNameField();
            this.appendMRRNameField();
            this.showSpinner = false;

        }, 1000);

        if (timeout["_idleTimeout"] === 1000) {
            clearTimeout(timeout);
        }

    }

    // next button handler
    handleNextYears() {

        this.showSpinner = true;

        const timeout = setTimeout(() => {
            this.columnsList.shift();

            if (this.currentFirstIndex >= 0) {

                this.currentFirstIndex += 12;
                this.currentLastIndex += 12;

                this.disableLeft = false;
                this.currentPageNumberIndex++;

                if (this.currentPageNumberIndex == this.totalCompletePages) {
                    this.disableRight = true;
                }

            }

            this.columnsList = this.columnsContainer.slice(this.currentFirstIndex, this.currentLastIndex);
            this.aggregateColumnsList = [...this.columnsList];
            this.arrColumnList = [...this.columnsList];
            this.appendARRNameField();
            this.appendNameField();
            this.appendMRRNameField();
            this.showSpinner = false;

        }, 1000);

        if (timeout["_idleTimeout"] === 1000) {
            clearTimeout(timeout);
        }

    }

    handleStartMonthPicklist(event) {
        this.startMonthComboboxValue = event.detail.value;
    }

    handleStartYearPicklist(event) {
        this.startYearComboboxValue = event.detail.value;
    }

    handleEndMonthPicklist(event) {
        this.endMonthComboboxValue = event.detail.value;
    }

    handleEndYearPicklist(event) {
        this.endYearComboboxValue = event.detail.value;
    }

    handleGetDataPicklist() {

        const startMonthAndYear = this.startMonthComboboxValue + '-' + this.startYearComboboxValue;
        const endMonthAndYear = this.endMonthComboboxValue + '-' + this.endYearComboboxValue;

        const startMonthAndYearIndex = this.retrievedYears.indexOf(startMonthAndYear);
        const endMonthAndYearIndex = this.retrievedYears.indexOf(endMonthAndYear);

        if (endMonthAndYearIndex - startMonthAndYearIndex < 0 || endMonthAndYearIndex - startMonthAndYearIndex > 11 || endMonthAndYearIndex < 0 || startMonthAndYearIndex < 0) {

            let lowerRange = endMonthAndYearIndex - startMonthAndYearIndex < 0 ? "\u2022 End year must be greater than start year." : '';
            let greaterRange = endMonthAndYearIndex - startMonthAndYearIndex > 11 ? "\u2022 Month count must be between 1-12 months." : '';
            let endMonthAndYearError = '';
            let startMonthAndYearError = '';
            let noEndStartError = '';

            if (endMonthAndYearIndex < 0 && startMonthAndYearIndex < 0) {
                noEndStartError = "\u2022 Please select valid start and end months.";
            } else if (startMonthAndYearIndex < 0) {
                startMonthAndYearError = "\u2022 Please select valid start month.";
            } else if (endMonthAndYearIndex < 0) {
                endMonthAndYearError = "\u2022 Please select valid end month."
            }

            const errorEvent = new ShowToastEvent({
                title: "Errors!",
                message: `${lowerRange} ${greaterRange} ${startMonthAndYearError} ${endMonthAndYearError} ${noEndStartError}`,
                variant: 'error',
                mode: 'dismissable'
            });


            this.dispatchEvent(errorEvent);
        } else {

            this.showSpinner = true;
            const timeout = setTimeout(() => {

                this.columnsList = this.columnsContainer.slice(startMonthAndYearIndex, endMonthAndYearIndex + 1);
                this.aggregateColumnsList = [...this.columnsList];
                this.arrColumnList = [...this.columnsList];
                this.appendNameField();
                this.appendARRNameField();
                this.appendMRRNameField();

                this.disableCombox = true;
                this.disableLeft = true;
                this.disableRight = true;
                this.disableReset = false;
                this.showSpinner = false;

            }, 1000);

            if (timeout["_idleTimeout"] === 1000) {
                clearTimeout(timeout);
            }
        }

    }

    handleResetPicklist() {

        this.showSpinner = true;

        const timeout = setTimeout(() => {

            this.startMonthComboboxValue = '';
            this.startYearComboboxValue = '';
            this.endMonthComboboxValue = '';
            this.endYearComboboxValue = '';

            this.currentFirstIndex = 0;
            this.currentLastIndex = 11;

            this.disableRight = false;
            this.disableLeft = true;
            this.disableCombox = false;
            this.disableReset = true;

            this.columnsList = this.columnsContainer.slice(this.currentFirstIndex, this.currentLastIndex + 1);
            this.aggregateColumnsList = [...this.columnsList];
            this.arrColumnList = [...this.columnsList];
            this.appendNameField();
            this.appendARRNameField();
            this.appendMRRNameField();

            this.showSpinner = false;

        }, 1000);

        if (timeout["_idleTimeout"] === 1000) {
            clearTimeout(timeout);
        }

    }
}





// const tempObj = {};
// let flag = 0;
// let previousMonth = 0;
// let total = 0;

// try {
//     for (let column of this.columnsContainer) {

//         flag++;


//         for (let data of this.dataListContainer) {
//             if (data.hasOwnProperty(column.fieldName)) {
//                 console.log("total => ", JSON.stringify(total));
//                 console.log(`Month = ${JSON.stringify(column.fieldName)} and value = ${JSON.stringify(+data[column.fieldName])}`);
//                 console.log("arr => ", JSON.stringify(+data["arr"]));
//                 console.log("previous month before => ", JSON.stringify(previousMonth));
//                 total = +data[column.fieldName] + +data["arr"] + previousMonth;
//                 previousMonth += +data[column.fieldName];
//             }

//             console.log("previous month after => ", JSON.stringify(previousMonth));
//         }



//         if (flag === this.columnsContainer.length - 1) {
//             tempObj["name"] = "ARR";
//         }

//         if (total > 0) {
//             tempObj[column.fieldName] = total;
//         }
//     }
// } catch (error) {
//     throw new error;
// }

// this.aggregateDataList.push({ ...tempObj });