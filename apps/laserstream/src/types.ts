export type EncodingType = 'base58' | 'base64' | 'base64+zstd' | 'jsonParsed'
export type CommitmentLevel = 'finalized' | 'confirmed' | 'processed'
export type TransactionDetails = 'full' | 'accounts' | 'signatures' | 'none'

export interface AccountSubscribeParams {
  encoding?: EncodingType
  commitment?: CommitmentLevel
  fromSlot?: number
}

export interface TransactionSubscribeFilter {
  vote?: boolean
  failed?: boolean
  accountInclude?: string[]
  accountExclude?: string[]
  accountRequired?: string[]
  signature?: string
  fromSlot?: number
}

export interface TransactionSubscribeParams {
  commitment?: CommitmentLevel
  encoding?: EncodingType
  transactionDetails?: TransactionDetails
  showRewards?: boolean
  maxSupportedTransactionVersion?: number
  fromSlot?: number
}

export interface AccountSubscribeRequest {
  jsonrpc: '2.0'
  id: number
  method: 'accountSubscribe'
  params: [string, AccountSubscribeParams?]
}

export interface TransactionSubscribeRequest {
  jsonrpc: '2.0'
  id: number
  method: 'transactionSubscribe'
  params: [TransactionSubscribeFilter?, TransactionSubscribeParams?]
}

export interface AccountNotification {
  jsonrpc: '2.0'
  method: 'accountNotification'
  params: {
    subscription: number
    result: {
      context: { slot: number }
      value: any
    }
  }
}

export interface TransactionNotification {
  jsonrpc: '2.0'
  method: 'transactionNotification'
  params: {
    subscription: number
    result: {
      transaction: any
      signature: string
      slot: number
      meta: any
    }
  }
}

export interface ProgramSubscribeParams {
  encoding?: EncodingType
  commitment?: CommitmentLevel
  filters?: any[]
  fromSlot?: number
}

export interface ProgramSubscribeRequest {
  jsonrpc: '2.0'
  id: number
  method: 'programSubscribe'
  params: [string, ProgramSubscribeParams?]
}

export interface ProgramNotification {
  jsonrpc: '2.0'
  method: 'programNotification'
  params: {
    subscription: number
    result: any
  }
}

export type WebSocketMessage =
  | { jsonrpc: '2.0'; id: number; result: number }
  | AccountNotification
  | TransactionNotification
  | ProgramNotification

export interface LaserStreamConfig {
  apiKey: string
  wsUrl: string
  pingInterval?: number
}
