export default function KPIcard({title, value}) {
  return (
    <div className="card">
      <div style={{fontSize:12, color:'#666'}}>{title}</div>
      <div style={{fontSize:20, marginTop:6}}>{value}</div>
    </div>
  );
}
