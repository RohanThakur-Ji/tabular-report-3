public class TablularReportHandler {

    @AuraEnabled(cacheable=true)
    public static Integer totalRecords(){
        try {
            List<Account> accountRecord = [SELECT Id FROM Account];
            return accountRecord.size();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<AccountWrapper> getAccountRecordsWire() {
        try {

            List<AccountWrapper> accountData = new List<AccountWrapper>();

            List<Account> accountRecords = [
                SELECT 
                    Name, Contract_Start_Date_CS__c, Churn_Date__c, Payment_Terms__c, CurrencyIsoCode, Amount__c, Contract_ARR__c, ARR__c 
                FROM Account 
                ORDER BY Contract_Start_Date_CS__c ASC
            ];

            for (Account record : accountRecords) {

                AccountWrapper temp = new AccountWrapper();
                
                temp.name = !String.isBlank(record.Name) ? record.Name : '';
                temp.paymentTerm = !String.isBlank(record.Payment_Terms__c) ? record.Payment_Terms__c : '';
                temp.contractStartDate = record.Contract_Start_Date_CS__c != null ? String.valueOf(record.Contract_Start_Date_CS__c) : '0000-00-00';
                temp.amount = record.Amount__c != null ? record.Amount__c : 0.0;
                temp.amountARR = record.Contract_ARR__c != null ? record.Contract_ARR__c : 0.0;
                temp.churnDate = record.Churn_Date__c != null ? String.valueOf(record.Churn_Date__c) : '0000-00-00';
                temp.ARR = record.ARR__c != null ? record.ARR__c : 0.0;

                accountData.add(temp);
                
            }

            return accountData;

        } catch (Exception exp) {
            throw new AuraException(exp.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<AccountWrapper> getAccountRecords(Integer limitSize, Integer offSet) {
        try {

            List<AccountWrapper> accountData = new List<AccountWrapper>();

            List<Account> accountRecords = [
                SELECT 
                    Name, Contract_Start_Date_CS__c, Churn_Date__c, Payment_Terms__c, CurrencyIsoCode, Amount__c, Contract_ARR__c 
                FROM Account 
                ORDER BY Contract_Start_Date_CS__c ASC
                LIMIT :limitSize
                OFFSET :offSet
            ];

            for (Account record : accountRecords) {

                AccountWrapper temp = new AccountWrapper();
                
                temp.name = !String.isBlank(record.Name) ? record.Name : '';
                temp.paymentTerm = !String.isBlank(record.Payment_Terms__c) ? record.Payment_Terms__c : '';
                temp.contractStartDate = record.Contract_Start_Date_CS__c != null ? String.valueOf(record.Contract_Start_Date_CS__c) : '0000-00-00';
                temp.amount = record.Amount__c != null ? record.Amount__c : 0.0;
                temp.amountARR = record.Contract_ARR__c != null ? record.Contract_ARR__c : 0.0;
                temp.churnDate = record.Churn_Date__c != null ? String.valueOf(record.Churn_Date__c) : '0000-00-00';

                accountData.add(temp);
                
            }

            return accountData;

        } catch (Exception exp) {
            throw new AuraException(exp.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<AccountWrapper> getAccountWithStartARR(Integer arrRowLimit, Integer arrOffset){
        try {
            List<AccountWrapper> accountWrapperList = new List<AccountWrapper>();

            List<Account> accountRecords = [
                SELECT 
                    Name, Contract_Start_Date_CS__c, Churn_Date__c, Payment_Terms__c, CurrencyIsoCode, Contract_ARR__c, ARR__c, Amount__c
                FROM Account
                ORDER BY Contract_Start_Date_CS__c ASC
                LIMIT :arrRowLimit
                OFFSET :arrOffset
            ];

            for (Account record : accountRecords) {

                AccountWrapper temp = new AccountWrapper();

                temp.name = !String.isBlank(record.Name) ? record.Name : '';
                temp.paymentTerm = !String.isBlank(record.Payment_Terms__c) ? record.Payment_Terms__c : '';
                temp.contractStartDate = record.Contract_Start_Date_CS__c != null ? String.valueOf(record.Contract_Start_Date_CS__c) : '0000-00-00';
                temp.amount = record.Amount__c != null ? record.Amount__c : 0.0;
                temp.amountARR = record.Contract_ARR__c != null ? record.Contract_ARR__c : 0.0;
                temp.churnDate = record.Churn_Date__c != null ? String.valueOf(record.Churn_Date__c) : '0000-00-00';
                temp.ARR = record.ARR__c != null ? record.ARR__c : 0.0;

                accountWrapperList.add(temp);

            }

            return accountWrapperList;

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public class AccountWrapper {
        @AuraEnabled
        public String name;

        @AuraEnabled
        public String paymentTerm;

        @AuraEnabled
        public String currencyCode;

        @AuraEnabled
        public String contractStartDate;

        @AuraEnabled
        public String contractRenewalDate;

        @AuraEnabled
        public String churnDate;

        @AuraEnabled
        public Decimal amount;

        @AuraEnabled 
        public Decimal amountARR;

        @AuraEnabled
        public Decimal ARR;
    }

}