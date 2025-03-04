<!--
 Copyright (c) 2020-2022 - for information on the respective copyright owner
 see the NOTICE file and/or the repository at
 https://github.com/hyperledger-labs/business-partner-agent

 SPDX-License-Identifier: Apache-2.0
-->

<template>
  <v-container>
    <!-- Valid/Invalid info for role verifier -->
    <v-container v-if="isStateVerified">
      <v-alert v-if="record.valid" dense border="left" type="success">
        {{ $t("view.presentationRecord.presentationValid") }}
      </v-alert>

      <v-alert v-else dense border="left" type="error">
        {{ $t("view.presentationRecord.presentationNotValid") }}
      </v-alert>
    </v-container>

    <!-- Request Content -->
    <h4 class="my-4">{{ $t("view.presentationRecord.requestContent") }}</h4>
    <v-container
      v-if="!isStateProposalSent"
      class="d-flex flex-wrap justify-space-between"
    >
      <!-- Requested Attributes -->
      <template
        v-for="([groupName, group], idx) in Object.entries(
          record.proofRequest['requestedAttributes']
        )"
      >
        <CredentialCard :key="groupName + idx" v-bind:document="group">
        </CredentialCard>
      </template>
      <!-- Requested Predicates -->
      <template
        v-for="([groupName, group], idx) in Object.entries(
          record.proofRequest['requestedPredicates']
        )"
      >
        <CredentialCard :key="groupName + idx" v-bind:document="group">
        </CredentialCard>
      </template>
    </v-container>

    <!-- About -->
    <!-- <v-card class="mb-3">
      <v-card-title height="40">{{
        $t("view.presentationRecord.about")
      }}</v-card-title> -->
      <v-divider></v-divider>

      <v-list dense>
        <v-list-item>
          <v-list-item-title
            class="grey--text text--darken-2 font-weight-medium"
          >
            {{ $t("view.presentationRecord.role") }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ record.role | capitalize }}
          </v-list-item-subtitle>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item>
          <v-list-item-title
            class="grey--text text--darken-2 font-weight-medium"
          >
            {{ $t("view.presentationRecord.state") }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{
              (record.state ? record.state.replace("_", " ") : "") | capitalize
            }}
          </v-list-item-subtitle>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item @click="toProofTemplate">
          <v-list-item-title
            class="grey--text text--darken-2 font-weight-medium"
          >
            {{ $t("view.presentationRecord.requestName") }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ record.proofRequest ? record.proofRequest.name : "" }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Timeline  -->
    <Timeline v-bind:timeEntries="record.stateToTimestampUiTimeline" />

    <!-- ExpertMode: Raw data -->
    <v-expansion-panels class="mt-4" v-if="expertMode" accordion flat>
      <v-expansion-panel>
        <v-expansion-panel-header
          class="grey--text text--darken-2 font-weight-medium bg-light"
          >{{ $t("showRawData") }}</v-expansion-panel-header
        >
        <v-expansion-panel-content class="bg-light">
          <vue-json-pretty :data="record"></vue-json-pretty>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script lang="ts">
import {
  PresentationExchangeStates,
  Predicates,
  RequestTypes,
  Restrictions,
  PresentationExchangeRoles,
} from "@/constants";
import CredentialCard from "@/components/CredentialCard.vue";
import Timeline from "@/components/Timeline.vue";
import {
  AriesProofExchange,
  PresentationRequestCredentials,
  ProofRequestedAttributes,
  SchemaAPI,
} from "@/services";

export default {
  name: "PresentationRecord",
  props: {
    record: {} as AriesProofExchange & {
      stateToTimestampUiTimeline: [string, number][];
    },
  },
  computed: {
    expertMode() {
      return this.$store.getters.getExpertMode;
    },
    isStateVerified() {
      return (
        this.record.role === PresentationExchangeRoles.VERIFIER &&
        (this.record.state === PresentationExchangeStates.VERIFIED ||
          this.record.state === PresentationExchangeStates.DONE)
      );
    },
    isStateProposalSent() {
      return this.record.state === PresentationExchangeStates.PROPOSAL_SENT;
    },
    contentPanels: {
      get: function () {
        if (this.record.proofRequest) {
          const nPanels = RequestTypes.map((type) => {
            return Object.keys(this.record.proofRequest[type]).length;
          }).reduce((x, y) => x + y, 0);

          return this.record.state ===
            PresentationExchangeStates.REQUEST_RECEIVED
            ? [...Array.from({ length: nPanels }).keys()].map(
                (k, index) => index
              )
            : [];
        } else {
          return [];
        }
      },
    },
  },
  methods: {
    selectedCredential(group: any, credential: PresentationRequestCredentials) {
      group.cvalues = {};
      this.names(group).map((name: string) => {
        group.cvalues[name] = credential.credentialInfo.attrs[name];
      });
    },
    names(item: ProofRequestedAttributes) {
      return item.names ? item.names : [item.name];
    },
    toRestrictionLabel(restrType: string) {
      const index = Object.values(Restrictions).findIndex((restriction) => {
        return restriction.value === restrType;
      });
      return index !== -1
        ? Object.values(Restrictions)[index].label
        : restrType;
    },
    toCredentialLabel(matchedCred: PresentationRequestCredentials) {
      if (matchedCred.credentialInfo) {
        const credInfo = matchedCred.credentialInfo;

        if (credInfo.credentialLabel) {
          return `${credInfo.credentialLabel} (${credInfo.credentialId})`;
        } else if (credInfo.schemaLabel) {
          return credInfo.issuerLabel
            ? `${credInfo.schemaLabel} (${credInfo.credentialId}) - ${credInfo.issuerLabel}`
            : credInfo.schemaLabel;
        } else {
          return credInfo.credentialId;
        }
      } else {
        return this.$t(
          "view.presentationRecord.matchingCredentials.noInfoFound"
        );
      }
    },
    renderSchemaLabel(attributeGroupName: string) {
      // If groupName contains schema id, try to render label else show group name
      const end = attributeGroupName.lastIndexOf(".");

      if (end !== -1) {
        const schemaId = attributeGroupName.slice(0, Math.max(0, end + 2));
        const schema = this.$store.getters.getSchemas.find(
          (s: SchemaAPI) => s.schemaId === schemaId
        );

        return schema && schema.label
          ? `<strong>${schema.label}</strong><i>&nbsp;(${schema.schemaId})</i>`
          : attributeGroupName;
      }

      return attributeGroupName;
    },
    toProofTemplate() {
      this.$router.push({
        name: "ProofTemplateView",
        params: {
          id: this.record.proofTemplateId,
        },
      });
    },
  },
  data: () => {
    return {
      Predicates,
      Restrictions,
      RequestTypes,
    };
  },
  components: {
    CredentialCard,
    Timeline,
  },
};
</script>
