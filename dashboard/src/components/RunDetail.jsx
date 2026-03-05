import RunDetailHeader from './RunDetailHeader'
import ItemList from './ItemList'

export default function RunDetail({ run, onBack }) {
  return (
    <main className="app-main">
      <RunDetailHeader run={run} onBack={onBack} />
      <ItemList items={run.items} />
    </main>
  )
}
