document.querySelectorAll('.nav-btn').forEach(btn=>{btn.onclick=()=>{document.querySelectorAll('.tab-pane').forEach(tab=>tab.classList.remove('active'));document.getElementById('tab-'+btn.dataset.tab).classList.add('active');document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active')}});

document.getElementById('btnAddVisit').onclick=function(){let date=document.getElementById('visitDate').value;if(!date)return alert('Pilih tanggal');let data=JSON.parse(localStorage.getItem('kunjungan')||'[]');let entry={tanggal:date,SD:+job_SD.value,SLTP:+job_SLTP.value,SLTA:+job_SLTA.value,MHS:+job_MHS.value,ASN:+job_ASN.value,GURU:+job_GURU.value,TNI:+job_TNI.value,SWASTA:+job_SWASTA.value,UMUM:+job_UMUM.value};data.push(entry);localStorage.setItem('kunjungan',JSON.stringify(data));alert('Data kunjungan disimpan');};

document.getElementById('btnExportVisitPDF').onclick=function(){let element=document.getElementById('reportVisitArea');html2pdf().from(element).save('laporan_kunjungan.pdf');};

document.getElementById('btnResetAll').onclick=function(){if(confirm('Hapus semua data?')){localStorage.clear();alert('Data dihapus');}};