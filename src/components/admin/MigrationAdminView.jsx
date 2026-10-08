import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import React from 'react'
import { MigrationView } from './MigrationView.jsx'

export const MigrationAdminView = ({ initPageResult, params, searchParams, user }) => {
  return (
    <DefaultTemplate
      i18n={initPageResult?.req?.i18n}
      locale={initPageResult?.locale}
      params={params}
      payload={initPageResult?.req?.payload}
      permissions={initPageResult?.permissions}
      searchParams={searchParams}
      user={user}
      visibleEntities={initPageResult?.visibleEntities}
    >
      <Gutter>
        <MigrationView />
      </Gutter>
    </DefaultTemplate>
  )
}
