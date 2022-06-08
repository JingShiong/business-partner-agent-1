/*
 * Copyright (c) 2020-2022 - for information on the respective copyright owner
 * see the NOTICE file and/or the repository at
 * https://github.com/hyperledger-labs/business-partner-agent
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { AxiosResponse } from "axios";
import { appAxios } from "@/services/interceptors";
import { ApiRoutes } from "@/constants";
import {
  AriesCredential,
  DeclineExchangeRequest,
  WalletCredentialRequest,
} from "@/services/types-services";

export default {
  getCredentialById(id: string): Promise<AxiosResponse<AriesCredential>> {
    return appAxios().get(`${ApiRoutes.WALLET}/credential/${id}`);
  },

  deleteCredential(id: string): Promise<AxiosResponse<void>> {
    return appAxios().delete(`${ApiRoutes.WALLET}/credential/${id}`);
  },

  updateCredential(
    id: string,
    content: WalletCredentialRequest
  ): Promise<AxiosResponse<void>> {
    return appAxios().put(`${ApiRoutes.WALLET}/credential/${id}`, content);
  },

  toggleCredentialVisibility(id: string): Promise<AxiosResponse<void>> {
    return appAxios().get(
      `${ApiRoutes.WALLET}/credential/${id}/toggle-visibility`
    );
  },

  acceptCredentialOffer(id: string): Promise<AxiosResponse<void>> {
    return appAxios().put(`${ApiRoutes.WALLET}/credential/${id}/accept-offer`);
  },

  async declineCredentialOffer(
    id: string,
    reasonMessage: string
  ): Promise<AxiosResponse<void>> {
    const body: DeclineExchangeRequest = {
      message: reasonMessage === undefined || "" ? undefined : reasonMessage,
    };

    return appAxios().put(
      `${ApiRoutes.WALLET}/credential/${id}/decline-offer`,
      body
    );
  },
};
