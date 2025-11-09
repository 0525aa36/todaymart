import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <article className="prose prose-slate max-w-none">
            <h1 className="text-4xl font-bold mb-2">이용약관</h1>
            <p className="text-lg text-muted-foreground mb-12">
              오늘마트 서비스를 이용해 주셔서 감사합니다. 본 약관은 오늘마트(이하 '회사')가 제공하는 전자상거래 관련 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>

            <div className="space-y-12">
              {/* Section 1 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제1조 (목적)</h2>
                <p className="text-base leading-relaxed">
                  본 약관은 오늘마트(이하 "회사")가 운영하는 온라인 쇼핑몰 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 서비스 이용조건 및 절차 등 기본적인 사항을 규정함을 목적으로 합니다.
                </p>
              </section>

              {/* Section 2 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제2조 (정의)</h2>
                <p className="text-base leading-relaxed mb-4">
                  본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
                </p>
                <div className="ml-6 space-y-3">
                  <div>
                    <p className="text-base"><span className="font-semibold">1. "회사"</span>란 오늘마트를 운영하는 사업자를 말합니다.</p>
                  </div>
                  <div>
                    <p className="text-base"><span className="font-semibold">2. "회원"</span>이란 회사와 서비스 이용계약을 체결하고 회원 아이디(ID)를 부여받은 자를 말합니다.</p>
                  </div>
                  <div>
                    <p className="text-base"><span className="font-semibold">3. "아이디(ID)"</span>란 회원의 식별과 서비스 이용을 위하여 회원이 설정하고 회사가 승인한 문자 또는 숫자의 조합을 말합니다.</p>
                  </div>
                  <div>
                    <p className="text-base"><span className="font-semibold">4. "비밀번호"</span>란 회원이 부여받은 아이디와 일치되는 회원임을 확인하고 회원의 비밀보호를 위해 회원 자신이 설정한 문자 또는 숫자의 조합을 말합니다.</p>
                  </div>
                  <div>
                    <p className="text-base"><span className="font-semibold">5. "상품"</span>이란 서비스를 통하여 제공되는 재화 또는 용역을 말합니다.</p>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제3조 (약관의 명시와 개정)</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">① </span>회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면 또는 연결화면에 게시합니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">② </span>회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「전자문서 및 전자거래기본법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">③ </span>회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 전부터 적용일자 전일까지 공지합니다. 다만, 회원에게 불리한 약관의 개정의 경우에는 최소한 30일 이상의 사전 유예기간을 두고 공지합니다.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제4조 (회원가입)</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">① </span>이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">② </span>회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                      <li>가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                      <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                      <li>허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</li>
                      <li>만 14세 미만 아동이 법정대리인의 동의를 얻지 아니한 경우</li>
                      <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">③ </span>회원가입계약의 성립 시기는 회사의 승낙이 회원에게 도달한 시점으로 합니다.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제5조 (회원 탈퇴 및 자격 상실)</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">① </span>회원은 회사에 언제든지 탈퇴를 요청할 수 있으며 회사는 즉시 회원탈퇴를 처리합니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">② </span>회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다.
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                      <li>가입 신청 시에 허위 내용을 등록한 경우</li>
                      <li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
                      <li>서비스를 이용하여 법령 또는 본 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 6 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제6조 (회원에 대한 통지)</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">① </span>회사가 회원에 대한 통지를 하는 경우, 회원이 회사와 미리 약정하여 지정한 전자우편 주소로 할 수 있습니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">② </span>회사는 불특정다수 회원에 대한 통지의 경우 1주일 이상 서비스 게시판에 게시함으로써 개별 통지에 갈음할 수 있습니다.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 7 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제7조 (구매신청)</h2>
                <div className="space-y-4">
                  <p className="text-base leading-relaxed">
                    회원은 서비스상에서 다음 또는 이와 유사한 방법에 의하여 구매를 신청하며, 회사는 회원이 구매신청을 함에 있어서 다음의 각 내용을 알기 쉽게 제공하여야 합니다.
                  </p>
                  <ul className="list-decimal list-inside ml-4 space-y-2 text-base">
                    <li>재화 등의 검색 및 선택</li>
                    <li>받는 사람의 성명, 주소, 전화번호, 전자우편주소 등의 입력</li>
                    <li>약관내용, 청약철회권이 제한되는 서비스, 배송료·설치비 등의 비용부담과 관련한 내용에 대한 확인</li>
                    <li>본 약관에 동의하고 위 3호의 사항을 확인하거나 거부하는 표시</li>
                    <li>재화 등의 구매신청 및 이에 관한 확인 또는 회사의 확인에 대한 동의</li>
                    <li>결제방법의 선택</li>
                  </ul>
                </div>
              </section>

              {/* Section 8 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제8조 (계약의 성립)</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">① </span>회사는 제7조와 같은 구매신청에 대하여 다음 각 호에 해당하면 승낙하지 않을 수 있습니다. 다만, 미성년자와 계약을 체결하는 경우에는 법정대리인의 동의를 얻지 못하면 미성년자 본인 또는 법정대리인이 계약을 취소할 수 있다는 내용을 고지하여야 합니다.
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                      <li>신청 내용에 허위, 기재누락, 오기가 있는 경우</li>
                      <li>미성년자가 담배, 주류 등 청소년보호법에서 금지하는 재화 및 용역을 구매하는 경우</li>
                      <li>기타 구매신청에 승낙하는 것이 회사 기술상 현저히 지장이 있다고 판단하는 경우</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">② </span>회사의 승낙이 제10조 제1항의 수신확인통지 형태로 회원에게 도달한 시점에 계약이 성립한 것으로 봅니다.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 9 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제9조 (지급방법)</h2>
                <p className="text-base leading-relaxed mb-4">
                  서비스에서 구매한 재화 또는 용역에 대한 대금지급방법은 다음 각 호의 방법 중 가용한 방법으로 할 수 있습니다. 단, 회사는 회원의 지급방법에 대하여 재화 등의 대금에 어떠한 명목의 수수료도 추가하여 징수할 수 없습니다.
                </p>
                <ul className="list-decimal list-inside ml-6 space-y-2 text-base">
                  <li>폰뱅킹, 인터넷뱅킹, 메일 뱅킹 등의 각종 계좌이체</li>
                  <li>선불카드, 직불카드, 신용카드 등의 각종 카드 결제</li>
                  <li>온라인무통장입금</li>
                  <li>전자화폐에 의한 결제</li>
                  <li>회사가 지급한 포인트에 의한 결제</li>
                  <li>회사와 계약을 맺었거나 회사가 인정한 상품권에 의한 결제</li>
                  <li>기타 전자적 지급 방법에 의한 대금 지급 등</li>
                </ul>
              </section>

              {/* Section 10 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제10조 (수신확인통지·구매신청 변경 및 취소)</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">① </span>회사는 회원의 구매신청이 있는 경우 회원에게 수신확인통지를 합니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">② </span>수신확인통지를 받은 회원은 의사표시의 불일치 등이 있는 경우에는 수신확인통지를 받은 후 즉시 구매신청 변경 및 취소를 요청할 수 있고 회사는 배송 전에 회원의 요청이 있는 경우에는 지체 없이 그 요청에 따라 처리하여야 합니다. 다만 이미 대금을 지불한 경우에는 제12조의 청약철회 등에 관한 규정에 따릅니다.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 11 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제11조 (재화 등의 공급)</h2>
                <p className="text-base leading-relaxed">
                  회사는 회원과 재화 등의 공급시기에 관하여 별도의 약정이 없는 이상, 회원이 청약을 한 날부터 7일 이내에 재화 등을 배송할 수 있도록 주문제작, 포장 등 기타의 필요한 조치를 취합니다. 다만, 회사가 이미 재화 등의 대금의 전부 또는 일부를 받은 경우에는 대금의 전부 또는 일부를 받은 날부터 3영업일 이내에 조치를 취합니다.
                </p>
              </section>

              {/* Section 12 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제12조 (환급)</h2>
                <p className="text-base leading-relaxed">
                  회사는 회원이 구매 신청한 재화 등이 품절 등의 사유로 인도 또는 제공을 할 수 없을 때에는 지체 없이 그 사유를 회원에게 통지하고 사전에 재화 등의 대금을 받은 경우에는 대금을 받은 날부터 3영업일 이내에 환급하거나 환급에 필요한 조치를 취합니다.
                </p>
              </section>

              {/* Section 13 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제13조 (청약철회 등)</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">① </span>회사와 재화 등의 구매에 관한 계약을 체결한 회원은 「전자상거래 등에서의 소비자보호에 관한 법률」 제13조 제2항에 따른 계약내용에 관한 서면을 받은 날(그 서면을 받은 때보다 재화 등의 공급이 늦게 이루어진 경우에는 재화 등을 공급받거나 재화 등의 공급이 시작된 날을 말합니다)부터 7일 이내에는 청약의 철회를 할 수 있습니다. 다만, 청약철회에 관하여 「전자상거래 등에서의 소비자보호에 관한 법률」에 달리 정함이 있는 경우에는 동 법 규정에 따릅니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">② </span>회원은 재화 등을 배송받은 경우 다음 각 호의 1에 해당하는 경우에는 반품 및 교환을 할 수 없습니다.
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                      <li>회원에게 책임 있는 사유로 재화 등이 멸실 또는 훼손된 경우(다만, 재화 등의 내용을 확인하기 위하여 포장 등을 훼손한 경우에는 청약철회를 할 수 있습니다)</li>
                      <li>회원의 사용 또는 일부 소비에 의하여 재화 등의 가치가 현저히 감소한 경우</li>
                      <li>시간의 경과에 의하여 재판매가 곤란할 정도로 재화등의 가치가 현저히 감소한 경우</li>
                      <li>같은 성능을 지닌 재화 등으로 복제가 가능한 경우 그 원본인 재화 등의 포장을 훼손한 경우</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 14 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제14조 (개인정보보호)</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">① </span>회사는 회원의 개인정보 수집 시 서비스제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">② </span>회사는 회원가입 시 구매계약이행에 필요한 정보를 미리 수집하지 않습니다. 다만, 관련 법령상 의무이행을 위하여 구매계약 이전에 본인확인이 필요한 경우로서 최소한의 특정 개인정보를 수집하는 경우에는 그러하지 아니합니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">③ </span>회사는 회원의 개인정보를 수집·이용하는 때에는 당해 회원에게 그 목적을 고지하고 동의를 받습니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">④ </span>회사는 수집된 개인정보를 목적 외의 용도로 이용할 수 없으며, 새로운 이용목적이 발생한 경우 또는 제3자에게 제공하는 경우에는 이용·제공단계에서 당해 회원에게 그 목적을 고지하고 동의를 받습니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">⑤ </span>회사가 제3항과 제4항에 의해 회원의 동의를 받아야 하는 경우에는 개인정보관리 책임자의 신원(소속, 성명 및 전화번호, 기타 연락처), 정보의 수집목적 및 이용목적, 제3자에 대한 정보제공 관련사항(제공받은자, 제공목적 및 제공할 정보의 내용) 등을 미리 명시하거나 고지해야 하며 회원은 언제든지 이 동의를 철회할 수 있습니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">⑥ </span>회원은 언제든지 회사가 가지고 있는 자신의 개인정보에 대해 열람 및 오류정정을 요구할 수 있으며 회사는 이에 대해 지체 없이 필요한 조치를 취할 의무를 집니다. 회원이 오류의 정정을 요구한 경우에는 회사는 그 오류를 정정할 때까지 당해 개인정보를 이용하지 않습니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">⑦ </span>회사는 개인정보 보호를 위하여 회원의 개인정보를 취급하는 자를 최소한으로 제한하여야 하며 신용카드, 은행계좌 등을 포함한 회원의 개인정보의 분실, 도난, 유출, 동의 없는 제3자 제공, 변조 등으로 인한 회원의 손해에 대하여 모든 책임을 집니다.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 15 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제15조 (회사의 의무)</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">① </span>회사는 법령과 본 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며 본 약관이 정하는 바에 따라 지속적이고, 안정적으로 재화·용역을 제공하는데 최선을 다하여야 합니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">② </span>회사는 회원이 안전하게 인터넷 서비스를 이용할 수 있도록 회원의 개인정보(신용정보 포함)보호를 위한 보안 시스템을 갖추어야 합니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">③ </span>회사가 상품이나 용역에 대하여 「표시·광고의 공정화에 관한 법률」 제3조 소정의 부당한 표시·광고행위를 함으로써 회원이 손해를 입은 때에는 이를 배상할 책임을 집니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">④ </span>회사는 회원이 원하지 않는 영리목적의 광고성 전자우편을 발송하지 않습니다.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 16 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제16조 (회원의 ID 및 비밀번호에 대한 의무)</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">① </span>ID와 비밀번호에 관한 관리책임은 회원에게 있습니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">② </span>회원은 자신의 ID 및 비밀번호를 제3자에게 이용하게 해서는 안됩니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">③ </span>회원이 자신의 ID 및 비밀번호를 도난당하거나 제3자가 사용하고 있음을 인지한 경우에는 바로 회사에 통보하고 회사의 안내가 있는 경우에는 그에 따라야 합니다.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 17 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제17조 (회원의 의무)</h2>
                <p className="text-base leading-relaxed mb-4">
                  회원은 다음 행위를 하여서는 안 됩니다.
                </p>
                <ul className="list-decimal list-inside ml-6 space-y-2 text-base">
                  <li>신청 또는 변경 시 허위 내용의 등록</li>
                  <li>타인의 정보 도용</li>
                  <li>회사에 게시된 정보의 변경</li>
                  <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                  <li>회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                  <li>회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                  <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                </ul>
              </section>

              {/* Section 18 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제18조 (분쟁해결)</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">① </span>회사는 회원이 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">② </span>회사는 회원으로부터 제출되는 불만사항 및 의견은 우선적으로 그 사항을 처리합니다. 다만, 신속한 처리가 곤란한 경우에는 회원에게 그 사유와 처리일정을 즉시 통보해 드립니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">③ </span>회사와 회원 간에 발생한 전자상거래 분쟁과 관련하여 회원의 피해구제신청이 있는 경우에는 공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 19 */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6">제19조 (재판권 및 준거법)</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">① </span>회사와 회원 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 회원의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다. 다만, 제소 당시 회원의 주소 또는 거소가 분명하지 않거나 외국 거주자의 경우에는 민사소송법상의 관할법원에 제기합니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold">② </span>회사와 회원 간에 제기된 전자상거래 소송에는 한국법을 적용합니다.
                    </p>
                  </div>
                </div>
              </section>

              {/* Final Section */}
              <section className="mt-12 pb-12">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <p className="text-base"><span className="font-semibold">공고일자:</span> 2025년 1월 1일</p>
                  <p className="text-base"><span className="font-semibold">시행일자:</span> 2025년 1월 1일</p>
                </div>
              </section>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  )
}
