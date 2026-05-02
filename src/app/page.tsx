'use client'
import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ minHeight:'100vh', background:'#0f1117', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'system-ui' }}>
      <div style={{ maxWidth:'480px', width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:'48px' }}>
          <div style={{ fontSize:'64px', marginBottom:'16px' }}>🧠</div>
          <h1 style={{ fontSize:'40px', fontWeight:900, color:'white', margin:'0 0 8px' }}>Math Academy</h1>
          <p style={{ color:'#8b93b8', fontSize:'16px', margin:0 }}>MCAP + MAP Prep for Tim & Jason</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px' }}>
          {[{name:'Tim',path:'tim',emoji:'🧑‍🎓',color:'#6c63ff'},{name:'Jason',path:'jason',emoji:'👨‍🎓',color:'#ff6b9d'}].map(t => (
            <Link key={t.path} href={`/dashboard/${t.path}`} style={{ textDecoration:'none' }}>
              <div style={{ background:'#1a1d27', border:'2px solid #2e3350', borderRadius:'20px', padding:'32px 24px', textAlign:'center', cursor:'pointer' }}>
                <div style={{ fontSize:'48px', marginBottom:'12px' }}>{t.emoji}</div>
                <div style={{ fontSize:'24px', fontWeight:900, color:'white', marginBottom:'4px' }}>{t.name}</div>
                <div style={{ fontSize:'13px', color:'#8b93b8' }}>My Dashboard →</div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign:'center' }}>
          <Link href="/parent" style={{ color:'#8b93b8', fontSize:'14px', textDecoration:'none' }}>👨‍👩‍👦 Parent Dashboard & Email Setup</Link>
        </div>
      </div>
    </main>
  )
}
