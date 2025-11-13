// Utility functions for exporting data

export function downloadAsJSON(data: any, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadAsCSV(data: any[], filename: string) {
  if (data.length === 0) return

  // Get headers from first object
  const headers = Object.keys(data[0])

  // Create CSV content
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ]

  const csvStr = csvRows.join('\n')
  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Format agent data for export
export function formatAgentsForExport(agents: any[]) {
  return agents.map(agent => ({
    ID: agent.id,
    Name: agent.name,
    Address: agent.address,
    Status: agent.status,
    'Reputation Score': agent.reputation_score,
    'Reputation Count': agent.reputation_count || 0,
    'Token ID': agent.token_id || 'N/A',
    'Owner Address': agent.owner_address || agent.address,
    'Created At': new Date(agent.created_at).toLocaleString(),
    'Updated At': new Date(agent.updated_at).toLocaleString(),
  }))
}

// Format activities for export
export function formatActivitiesForExport(activities: any[]) {
  return activities.map(activity => ({
    ID: activity.id,
    Type: activity.activity_type,
    Description: activity.description,
    'Agent ID': activity.agent_id,
    'Agent Name': activity.agent?.name || 'N/A',
    'Transaction Hash': activity.tx_hash || 'N/A',
    'Created At': new Date(activity.created_at).toLocaleString(),
  }))
}
