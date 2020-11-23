pragma solidity >=0.4.22 <0.7.0;

    struct Preferences{
        /**
         * This struct holds the user specific preferences.
         * Every user will have its preferences in an instance of
         * this struct.
         */

        bool wouldLikeToReceiveDebtRotationOffers;

        // Is not null if wouldLikeToReceiveDebtRotationOffers is true.
        MessageReceivingFrequency frequency;
    }

    enum MessageReceivingFrequency { Daily, Weekly, OnContractTermination }